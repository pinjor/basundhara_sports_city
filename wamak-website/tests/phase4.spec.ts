import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { axe } from "./helpers";

const sink = "http://localhost:3199/leads";
type Lead = { kind: string; ref: string; fields: Record<string, string> };
const leads = async (): Promise<Lead[]> => (await fetch(sink)).json();
const leadByRef = async (ref: string) => (await leads()).find((l) => l.ref === ref);

async function fillDelivery(page: Page, country = "Netherlands") {
  await page.getByLabel("Destination country").selectOption(country);
  await page.getByLabel("Destination port or airport").fill("Rotterdam");
  await page.getByText("FOB", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function fillAboutYou(page: Page, company: string) {
  await page.getByRole("textbox", { name: "Company", exact: true }).fill(company);
  await page.getByLabel("Contact person").fill("Anna de Vries");
  await page.getByLabel("Business email").fill("anna@example.com");
  await page.getByLabel(/WAMAK GROUP may use these details/).check();
  await page.getByRole("button", { name: "Send your requirement" }).click();
}

async function refFromThankYou(page: Page) {
  await expect(page).toHaveURL(/\/request-quote\/thank-you\?ref=WMK-/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thank you. We've received your request.");
  return decodeURIComponent(new URL(page.url()).searchParams.get("ref")!);
}

test("Journey A: home, category, product, request quote, thank you", async ({ page }) => {
  await page.goto("/?utm_source=linkedin&utm_campaign=autumn");
  await page.getByRole("link", { name: "Jute & eco-friendly products" }).first().click();
  await expect(page).toHaveURL(/\/products\/jute-eco-friendly$/);
  await page.getByRole("link", { name: "Jute tote bags" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jute tote bags");
  await page.getByRole("link", { name: "Request quote for this product" }).click();

  await expect(page).toHaveURL(/request-quote\?product=jute-eco-friendly\/jute-tote-bags/);
  await expect(page.getByRole("link", { name: "Jute tote bags" })).toBeVisible();
  await expect(page.getByLabel("Category")).toHaveValue("jute-eco-friendly");

  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("5,000");
  await page.getByRole("button", { name: /Packaging, customization and files/ }).click();
  await page.getByLabel("Logo or branding").check();
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "fixtures/spec.pdf"));
  await expect(page.getByText("spec.pdf", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: /Delivery/ })).toBeFocused();
  await fillDelivery(page);
  await fillAboutYou(page, "Journey A BV");
  const ref = await refFromThankYou(page);
  await expect(page.getByText("Jute tote bags")).toBeVisible();

  const lead = await leadByRef(ref);
  expect(lead?.kind).toBe("rfq");
  expect(lead?.fields["Products from RFQ list"]).toContain("Jute tote bags");
  expect(lead?.fields["Quantity"]).toBe("5,000 pieces");
  expect(lead?.fields["Incoterm"]).toBe("FOB");
  expect(lead?.fields["Customization"]).toBe("Logo or branding");
  expect(lead?.fields["Attachment"]).toMatch(/^spec\.pdf/);
  expect(lead?.fields["Source page"]).toBe("/products/jute-eco-friendly/jute-tote-bags");
  expect(lead?.fields["UTM"]).toContain("utm_source=linkedin");

  // RFQ list is cleared after sending.
  await expect(page.getByRole("button", { name: /^RFQ list/ })).toHaveCount(0);
});

test("Journey B: home, customized sourcing, send requirement, wizard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Send your requirement" }).first().click();
  await expect(page).toHaveURL(/request-quote\?category=customized-sourcing/);
  await expect(page.getByLabel("Category")).toHaveValue("customized-sourcing");

  await page.getByLabel("Product and specification").fill("Cotton canvas tote with jute trim, 38 x 42 cm, screen-printed logo");
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("2");
  await page.getByLabel("Unit").selectOption("40ft containers");
  await page.getByRole("button", { name: "Continue" }).click();
  await fillDelivery(page, "United Arab Emirates");
  await fillAboutYou(page, "Journey B LLC");
  const ref = await refFromThankYou(page);
  const lead = await leadByRef(ref);
  expect(lead?.fields["Category"]).toBe("customized-sourcing");
  expect(lead?.fields["Quantity"]).toBe("2 40ft containers");
  expect(lead?.fields["Destination"]).toBe("Rotterdam, United Arab Emirates");
});

test("Journey C: products hub, several products, one RFQ", async ({ page }) => {
  await page.goto("/products/loofah-bath");
  await page.getByRole("button", { name: "Add Natural loofah sponges to your RFQ list" }).click();
  await page.getByRole("button", { name: "Add Mesh bath sponges and poufs to your RFQ list" }).click();
  await page.goto("/products/sisal-natural-fibre");
  await page.getByRole("button", { name: "Add Sisal rope and twine to your RFQ list" }).click();

  await page.getByRole("button", { name: "RFQ list, 3 products" }).click();
  const drawer = page.getByRole("dialog", { name: /Your RFQ list/ });
  await drawer.getByLabel("Quantity or notes (optional)").nth(2).fill("20 tonnes, 6mm");
  await drawer.getByLabel("Quantity or notes (optional)").nth(2).blur();
  await drawer.getByRole("link", { name: "Request a quote for 3 products" }).click();

  await expect(page.getByRole("heading", { name: "Products on your RFQ list (3)" })).toBeVisible();
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("See per-item notes");
  await page.getByRole("button", { name: "Continue" }).click();
  await fillDelivery(page, "Germany");
  await fillAboutYou(page, "Journey C GmbH");
  const ref = await refFromThankYou(page);
  const lead = await leadByRef(ref);
  expect(lead?.fields["Products from RFQ list"].split("\n")).toEqual([
    "Natural loofah sponges",
    "Mesh bath sponges and poufs",
    "Sisal rope and twine (20 tonnes, 6mm)",
  ]);
});

test("wizard: required fields, specific errors, and saved progress", async ({ page }) => {
  await page.goto("/request-quote");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Tell us the product or choose a category.")).toBeVisible();
  await expect(page.getByText("Enter a quantity, for example 5,000 or 2.")).toBeVisible();
  await expect(page.getByLabel("Product and specification")).toBeFocused();
  const results = await axe(page);
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await page.getByLabel("Product and specification").fill("Jute rugs, round, 120 cm");
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("800");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Choose the destination country.")).toBeVisible();

  // Progress survives a reload.
  await page.reload();
  await expect(page.getByLabel("Product and specification")).toHaveValue("Jute rugs, round, 120 cm");
  await expect(page.getByRole("textbox", { name: "Quantity", exact: true })).toHaveValue("800");

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Destination country").selectOption("Japan");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Send your requirement" }).click();
  await expect(page.getByText("Enter your company name.")).toBeVisible();
  await expect(page.getByText("Please confirm we may use these details")).toBeVisible();
  const results3 = await axe(page);
  expect(results3.violations, JSON.stringify(results3.violations, null, 2)).toEqual([]);
});

test("file upload rejects a disguised file on the client", async ({ page }) => {
  await page.goto("/request-quote?privateLabel=1");
  // Private label pre-checked and the optional section opened.
  await expect(page.getByLabel("Private label")).toBeChecked();
  await page.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(page.getByText("Upload a PDF, JPG or PNG file.")).toBeVisible();
});

test("server rejects a file whose bytes don't match its type, and ignores honeypot spam", async ({ page }) => {
  await page.goto("/request-quote?product=seafood/mud-crab");
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("500 kg");
  await page.getByRole("button", { name: /Packaging, customization and files/ }).click();
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "fixtures/fake.pdf"));
  await page.getByRole("button", { name: "Continue" }).click();
  await fillDelivery(page, "Singapore");
  await fillAboutYou(page, "Disguised File Pte");
  await expect(page.getByRole("heading", { name: /What you need/ })).toBeVisible();
  await expect(page.getByText("This file doesn't look like a valid PDF, JPG or PNG.").last()).toBeVisible();
  await expect(page).toHaveURL(/\/request-quote\?/);

  // Honeypot: a filled hidden field gets a normal-looking success and no lead.
  const before = (await leads()).length;
  await page.getByRole("button", { name: "Remove fake.pdf" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /About you/ })).toBeVisible();
  await page.locator("#rfq-website").fill("http://spam.example", { force: true });
  await page.getByRole("button", { name: "Send your requirement" }).click();
  await refFromThankYou(page);
  expect((await leads()).length).toBe(before);
});

test("contact form: catalogue request prefilled, validated and sent", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Request the latest catalogue" }).click();
  await expect(page).toHaveURL(/\/contact\?topic=catalogue/);
  await expect(page.getByLabel("Topic")).toHaveValue("Catalogue request");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Enter your name.")).toBeVisible();
  const results = await axe(page);
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Kenji Sato");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("kenji@example.jp");
  await page.getByLabel("Message").fill("Please send your latest catalogue for home décor and loofah.");
  await page.getByLabel(/WAMAK GROUP may use these details/).check();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your message is on its way" })).toBeVisible();
  const ref = (await page.getByText(/MSG-/).textContent())!.match(/MSG-[\w-]+/)![0];
  const lead = await leadByRef(ref);
  expect(lead?.kind).toBe("contact");
  expect(lead?.fields["Topic"]).toBe("Catalogue request");
});

test("thank-you and request pages pass axe", async ({ page }) => {
  for (const route of ["/request-quote", "/request-quote/thank-you?ref=WMK-TEST", "/contact"]) {
    await page.goto(route);
    const results = await axe(page);
    expect(results.violations, `${route}\n${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
  }
});
