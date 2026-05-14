import { test, expect } from '@playwright/test'

const SUPERADMIN = { email: 'welllogsupport@gmail.com', password: '$uperAdmin' }
const ADMIN = { email: 'admin@venver.com.ar', password: 'Admin#Venver1' }
const OPERADOR = { email: 'operador.v51@venver.com.ar', password: 'Op#V51campo' }
const AUDITOR = { email: 'auditor@ypf.com', password: 'Audit#YPF1' }

async function login(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

test.describe('Autenticación', () => {
  test('Login superadmin → redirige a /superadmin', async ({ page }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password)
    await page.waitForURL('**/superadmin**', { timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Plataforma', exact: true })).toBeVisible()
  })

  test('Login admin → redirige a /admin', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.waitForURL('**/admin**', { timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('Login operador → redirige a /operador', async ({ page }) => {
    await login(page, OPERADOR.email, OPERADOR.password)
    await page.waitForURL('**/operador**', { timeout: 15000 })
    // Operador ve botones de ingreso/salida o "Tablet sin configurar"
    await page.waitForTimeout(2000)
    const page_content = await page.textContent('body')
    expect(page_content).toMatch(/Nuevo Ingreso|Tablet sin configurar|WELL LOG/)
  })

  test('Login auditor → redirige a /auditor', async ({ page }) => {
    await login(page, AUDITOR.email, AUDITOR.password)
    await page.waitForURL('**/auditor**', { timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Dashboard Auditor' })).toBeVisible()
  })

  test('Login con credenciales incorrectas → no navega', async ({ page }) => {
    await login(page, 'noexiste@test.com', 'wrongpassword')
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('/login')
  })

  test('Logout desde admin funciona', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.waitForURL('**/admin**', { timeout: 15000 })
    await page.click('button[title="Cerrar sesión"]')
    await page.waitForURL('**/login**', { timeout: 10000 })
  })
})
