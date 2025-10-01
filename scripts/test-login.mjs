const response = await fetch("http://127.0.0.1:4000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "admin@police.belgium.eu",
    password: "ChangeMeAdmin42!",
  }),
  redirect: "manual",
});

const text = await response.text();
console.log("status", response.status);
console.log(text);
