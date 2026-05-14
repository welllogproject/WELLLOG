import { test, expect } from '@playwright/test'

const OPERADOR = { email: 'operador.v51@venver.com.ar', password: 'Op#V51campo' }

async function loginOperador(page: any) {
  await page.goto('/login')
  await page.fill('input[type="email"]', OPERADOR.email)
  await page.fill('input[type="password"]', OPERADOR.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/operador**', { timeout: 10000 })
}

test.describe('Operador', () => {
  test('Login y vista principal carga', async ({ page }) => {
    await loginOperador(page)
    await expect(page.locator('text=Nuevo Ingreso')).toBeVisible()
    await expect(page.locator('text=Marcar Salida')).toBeVisible()
  })

  test('Botón Nuevo Ingreso abre flujo DNI', async ({ page }) => {
    await loginOperador(page)
    await page.click('text=Nuevo Ingreso')
    await page.waitForURL('**/ingreso**')
    await expect(page.locator('text=Nuevo Ingreso — DNI')).toBeVisible()
  })

  test('Menú hamburguesa muestra opciones', async ({ page }) => {
    await loginOperador(page)
    await page.click('button[aria-label="Menú"]')
    await expect(page.locator('text=Salir')).toBeVisible()
  })
})
