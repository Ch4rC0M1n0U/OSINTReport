<template>
  <div class="min-h-screen bg-base-200" data-theme="osint">
    <div class="drawer lg:drawer-open">
      <input id="app-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col">
        <header class="navbar bg-base-100 border-b">
          <div class="flex-none lg:hidden">
            <label for="app-drawer" aria-label="ouvrir le menu" class="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div class="flex-1">
            <h1 class="text-xl font-semibold text-primary">OSINTReport</h1>
          </div>
          <div class="flex-none">
            <slot name="header" />
          </div>
        </header>
        <main class="flex-1 overflow-auto p-4">
          <slot />
        </main>
      </div>
      <div class="drawer-side">
        <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <aside class="bg-base-100 w-72 min-h-full border-r">
          <div class="p-4">
            <slot name="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
