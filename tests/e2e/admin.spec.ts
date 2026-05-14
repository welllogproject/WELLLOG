import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@venver.com.ar', password: 'Admin#Venver1' }

async function loginAdmin(page: any) {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN.email)
  await page.fill('input[type="password"]', ADMIN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin**', { timeout: 15000 })
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('Dashboard carga KPIs', async ({ page }) => {
    await expect(page.getByText('Personas dentro')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Ingresos hoy')).toBeVisible()
  })

  test('Registros carga tabla', async ({ page }) => {
    await page.getByRole('link', { name: 'Registros' }).click()
    await page.waitForURL('**/registros**')
    await expect(page.getByRole('heading', { name: /Registros de Acceso/ })).toBeVisible()
  })

  test('Mapa carga sin crash', async ({ page }) => {
    await page.getByRole('link', { name: 'Mapa de Equipos' }).click()
    await page.waitForURL('**/mapa**')
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 })
  })

  test('Estadísticas HSE carga', async ({ page }) => {
    await page.getByRole('link', { name: 'HSE' }).click()
    await page.waitForURL('**/hse**')
    await expect(page.getByText('Índice de Frecuencia')).toBeVisible({ timeout: 10000 })
  })

  test('Auditores carga', async ({ page }) => {
    await page.getByRole('link', { name: 'Auditores' }).click()
    await page.waitForURL('**/auditores**')
    await expect(page.getByText('Invitar auditor')).toBeVisible({ timeout: 10000 })
  })
})
