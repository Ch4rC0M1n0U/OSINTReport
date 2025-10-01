import { randomUUID } from "node:crypto";
import request, { type Test } from "supertest";

import { app } from "../../src/app";
import { prisma } from "../../src/shared/prisma";
import { bootstrapAuth } from "../../src/modules/auth/bootstrap";
import { AuthService } from "../../src/modules/auth/auth.service";
import { PermissionCode } from "../../src/modules/auth/auth.constants";
import { hashPassword } from "../../src/shared/password";

const globalState = globalThis as typeof globalThis & {
	__E2E_BOOTSTRAPPED__?: boolean;
};

export async function ensureBootstrap() {
	if (!globalState.__E2E_BOOTSTRAPPED__) {
		await bootstrapAuth();
		globalState.__E2E_BOOTSTRAPPED__ = true;
	}
}

type CreateUserOptions = {
	roleName?: string;
};

export async function createUserWithPermissions(
	permissions: PermissionCode[],
	options: CreateUserOptions = {}
): Promise<{ id: string; email: string; password: string; accessToken: string }> {
	await ensureBootstrap();

	const unique = randomUUID().split("-")[0];
	const email = `user_${unique}@osint.local`;
	const password = "TestPassword42!";

	let role = options.roleName
		? await prisma.role.findUnique({ where: { name: options.roleName } })
		: null;

	if (!role) {
		role = await prisma.role.findFirst({
			where: {
				permissions: {
					every: {
						permission: {
							code: {
								in: permissions,
							},
						},
					},
				},
			},
		});
	}

	if (!role) {
		throw new Error("Aucun rôle correspondant aux permissions demandées");
	}

	const user = await prisma.user.create({
		data: {
			firstName: "Test",
			lastName: "User",
			matricule: `TEST-${unique}`,
			email,
			passwordHash: await hashPassword(password),
			roleId: role.id,
			status: "ACTIVE",
		},
	});

	const login = await AuthService.login(
		{ email, password },
		{ userAgent: "vitest", ipAddress: "127.0.0.1" }
	);

	return {
		id: user.id,
		email,
		password,
		accessToken: login.accessToken,
	};
}

export function authRequest(token: string) {
	const agent = request(app);
		const withAuth = <T extends Test>(test: T) =>
		test.set("Authorization", `Bearer ${token}`).set("Accept", "application/json");

	return {
		get: (url: string) => withAuth(agent.get(url)),
		post: (url: string) => withAuth(agent.post(url)),
		patch: (url: string) => withAuth(agent.patch(url)),
		delete: (url: string) => withAuth(agent.delete(url)),
	};
}

export async function truncateReportData() {
	const tables = [
		"ReportAttachment",
		"ResearchRecord",
		"ReportModule",
		"ReportVersion",
		"VaultItem",
		"Report",
		"Entity",
	];

	for (const table of tables) {
		await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
	}
}

export async function truncateUsers() {
	await prisma.userSession.deleteMany();
	await prisma.user.deleteMany({
		where: {
			email: {
				startsWith: "user_",
				endsWith: "@osint.local",
			},
		},
	});
}
