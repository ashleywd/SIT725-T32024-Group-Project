import { test, expect } from '@playwright/test';

// Function to generate a random integer within a given range
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to generate a random future date/time
const getRandomFutureDateTime = () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + getRandomInt(1, 30)); // Random date within next 30 days
  const hours = getRandomInt(8, 22); // Random hour between 8 AM - 10 PM
  const minutes = getRandomInt(0, 1) === 0 ? '00' : '30'; // Choose between :00 or :30 minutes
  return futureDate.toISOString().split('T')[0] + `T${hours}:${minutes}`; // Format: YYYY-MM-DDTHH:MM
};

function formatDateTime(isoString) {
  const date = new Date(isoString); // Convert ISO string to Date object

  return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true // Use 12-hour format with AM/PM
  }).format(date);
}


test.describe('Post Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login credentials
    const username = 'testuser1'; // Use valid credentials
    const password = '123456';

    const usernameInput = page.getByLabel('username');
    const passwordInput = page.getByLabel('password');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill(username);
    await passwordInput.fill(password);

    // Click login button
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // Ensure successful login & redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome to BabySwap')).toBeVisible();
  });

 test('User successfully creates a post and verifies it in My Posts page', async ({ page }) => {
    // Get current user points from navbar
    const currentPoints = await page.evaluate(() => {
        const pointsElement = document.querySelector("#userPoints");
        return pointsElement ? parseInt(pointsElement.innerText.trim(), 10) || 0 : 0;
    });


    // Generate a valid randomHours (must be ≤ currentPoints)
    const maxHours = Math.max(1, Math.min(currentPoints, 10)); 
    const randomHours = getRandomInt(1, maxHours);

    const PostType = currentPoints === 0 ? 'Offering Babysitting' : 'Requesting Babysitter';
    const randomDateTime = getRandomFutureDateTime();
    const randomDescription = `Random test post with ${randomHours} hours.`;

    // Click "Create Post" button to open modal
    await page.getByRole('button', { name: 'Create Post' }).click();
    await page.waitForSelector('#postForm', { state: 'visible' });

    // Select post type
    await page.locator('#postForm input[type="text"]').click();
    await page.locator('span').filter({ hasText: PostType }).click();

    // Type in hours needed (ensured to be within available points)
    await page.getByRole('spinbutton', { name: 'Hours Needed' }).fill(String(randomHours));

    // Set date and time
    await page.getByRole('textbox', { name: 'Date and Time' }).fill(randomDateTime);

    // Fill description
    await page.getByRole('textbox', { name: 'Description' }).fill(randomDescription);

    // Submit the post
    await page.getByRole('button', { name: 'Submit' }).click();

    // Wait for server response to confirm post submission
    await page.waitForResponse(response => response.url().includes('/api/posts') && response.status() === 200);

    // Ensure modal's closed
    await page.waitForSelector('#postForm', { state: 'hidden' });

    // Navigate to "My Posts" page
    await page.getByRole('navigation').getByRole('link', { name: 'My Posts' }).click();
    await expect(page).toHaveURL('/my-posts');

  // Verify the first .card-content element contains the expected text
    await expect(page.locator('.card-content').first()).toContainText(randomDescription);
    await expect(page.locator('.card-content').first()).toContainText(`${randomHours} hours`);
    const formattedDate = formatDateTime(randomDateTime);
    await expect(page.locator('.card-content').first()).toContainText(formattedDate);

});


  test('User cannot submit post if points are insufficient', async ({ page }) => {
    // login
    await page.goto('/login');
    await page.getByLabel('username').fill('testuser1');
    await page.getByLabel('password').fill('123456');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');

   // Get current user points from navbar
    const currentPoints = await page.evaluate(() => {
    const pointsElement = document.querySelector("#userPoints");
    return pointsElement ? parseInt(pointsElement.innerText.trim(), 10) || 0 : 0;
    });

    // request more hours than points
    const excessiveHours = currentPoints + 10; 
    const randomDateTime = getRandomFutureDateTime();

    // Click "Create Post" button to open modal
    await page.getByRole('button', { name: 'Create Post' }).click();
    await page.waitForSelector('#postForm', { state: 'visible' });

    // Select post type
    await page.locator('#postForm input[type="text"]').click();
    await page.locator('span').filter({ hasText: 'Requesting Babysitter' }).click();

    // Type in hours needed (ensured to be within available points)
    await page.getByRole('spinbutton', { name: 'Hours Needed' }).fill(String(excessiveHours));

    // Set date and time
    await page.getByRole('textbox', { name: 'Date and Time' }).fill(randomDateTime);

    // Fill description
    await page.getByRole('textbox', { name: 'Description' }).fill("I need someone to babysit my child");

    // Submit the post
    await page.getByRole('button', { name: 'Submit' }).click();

    // check error message
    const errorMessage = page.getByText('Insufficient points for this request');
    await expect(errorMessage).toBeVisible();
});

});
