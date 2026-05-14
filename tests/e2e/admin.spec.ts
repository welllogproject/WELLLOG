import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@venver.com.ar', password: 'Admin#Venver1' }

async function loginAdmin(page: any) {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN.email)
  await page.fill('input[type="password"]', ADMIN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin**', { timeout: 10000 })
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('Dashboard carga KPIs', async ({ page }) => {
    await expect(page.locator('text=Personas dentro')).toBeVisible()
    await expect(page.locator('text=Ingresos hoy')).toBeVisible()
    await expect(page.locator('text=Equipos activos')).toBeVisible()
  })

  test('Registros carga tabla', async ({ page }) => {
    await page.click('text=Registros')
    await page.waitForURL('**/registros**')
    await expect(page.locator('text=Registros de Acceso')).toBeVisible()
  })

  test('Mapa carga sin crash', async ({ page }) => {
    await page.click('text=Mapa de Equipos')
    await page.waitForURL('**/mapa**')
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 })
  })

  test('Equipos carga lista', async ({ page }) => {
    await page.click('text=Equipos')
    await page.waitForURL('**/equipos**')
    await expect(page.locator('text=Nuevo equipo')).toBeVisible()
  })

  test('Usuarios carga lista', async ({ page }) => {
    await page.click('text=Usuarios')
    await page.waitForURL('**/usuarios**')
    await expect(page.locator('text=Invitar usuario')).toBeVisible()
  })

  test('Auditores carga', async ({ page }) => {
    await page.click('text=Auditores')
    await page.waitForURL('**/auditores**')
    await expect(page.locator('text=Invitar auditor')).toBeVisible()
  })

  test('Estadísticas HSE carga', async ({ page }) => {
    await page.click('text=HSE')
    await page.waitForURL('**/hse**')
    await expect(page.locator('text=Índice de Frecuencia')).toBeVisible()
  })
})
