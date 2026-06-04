describe("TalentOS smoke flow", () => {
  it("signs in and loads the dashboard", () => {
    cy.visit("/login");
    cy.contains("TalentOS");
    cy.get('input[name="email"]').clear().type("hr.admin@tms.local");
    cy.get('input[name="password"]').clear().type("Password123!");
    cy.contains("button", "Sign in").click();
    cy.contains("Executive Dashboard");
    cy.contains("Open Roles");
  });
});
