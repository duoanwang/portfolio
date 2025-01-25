console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '/portfolio/', title: 'Home' },
    { url: '/portfolio/project/', title: 'Projects' },
    { url: '/portfolio/contact/', title: 'Contact' },
    { url: '/portfolio/resume/', title: 'Resume' },
    { url: "https://github.com/duoanwang", title: 'Github' },
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

// Check if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // Create link and add it to nav
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    if (a.host !== location.host) {
        a.target = '_blank';
      }
  }

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select id="themeSelector">
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
      </label>`
);

// Get a reference to the <select> element
const select = document.querySelector("#themeSelector");

// Function to update the color scheme
function updateColorScheme(value) {
  // Set the color-scheme property on the root element
  document.documentElement.style.setProperty("color-scheme", value);

  // Save the user's preference in localStorage
  localStorage.setItem("theme", value);
}

// Attach an event listener to the <select> element
select.addEventListener("input", function (event) {
  const selectedTheme = event.target.value;
  console.log("Color scheme changed to", selectedTheme);
  updateColorScheme(selectedTheme);
});

// Initialize the theme on page load
function initializeTheme() {
  // Retrieve the saved theme from localStorage, or default to "light dark" (automatic)
  const savedTheme = localStorage.getItem("theme") || "light dark";
  select.value = savedTheme; // Set the dropdown to the saved value
  updateColorScheme(savedTheme); // Apply the saved theme
}

// Call the initialization function when the page loads
initializeTheme();



// Get a reference to the <form> element
const form = document.querySelector("form");

// Add an event listener to the form's submit event
form?.addEventListener("submit", function (event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Create a new FormData object from the form
  const data = new FormData(form);

  // Start building the URL
  let url = "mailto:anw043@ucsd.edu?";
  let params = [];

  // Iterate over the submitted fields
  for (let [name, value] of data) {
    // Encode the name and value, ensuring spaces are encoded as %20
    params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    console.log(name, value);
  }

  // Join all parameters with "&" and append to the URL
  url += params.join("&");

  // Log the final URL
  console.log("Final URL:", url);

  // Optional: Open the email client with the constructed URL
  window.location.href = url;
});




