console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '/portfolio/', title: 'Home' },
    { url: '/portfolio/project/', title: 'Projects' },
    { url: '/portfolio/contact/', title: 'Contact' },
    { url: '/portfolio/resume/', title: 'Resume' },
    { url: 'https://github.com/duoanwang', title: 'Github' },
];
  
let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let a = document.createElement('a');
    a.href = p.url;
    a.textContent = p.title;
  
      // Highlight the current page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
  
      // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = '_blank';
    }
  
    nav.append(a);
}

// let nav = document.createElement('nav');
// document.body.prepend(nav);

// // Check if we are on the home page
// const ARE_WE_HOME = document.documentElement.classList.contains('home');

// for (let p of pages) {
//     let url = p.url;
//     let title = p.title;
//     // Create link and add it to nav
//     url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
//     let a = document.createElement('a');
//     a.href = url;
//     a.textContent = title;
//     nav.append(a);

//     if (a.host === location.host && a.pathname === location.pathname) {
//         a.classList.add('current');
//     }

//     if (a.host !== location.host) {
//         a.target = '_blank';
//     }

//     nav.append(a);
// }


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


export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      console.log(response); 
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      return data; 
      

  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

// export function renderProjects(projects, containerElement) {
//   // Step 1: Clear existing content
//   containerElement.innerHTML = '';

//   // Step 2: Check if the containerElement is valid
//   if (!containerElement || !(containerElement instanceof HTMLElement)) {
//       console.error('Invalid container element:', containerElement);
//       return;
//   }

//   // Step 3: Loop through each project and create an <article> for it
//   projects.forEach(project => {
//       // Step 4: Create an article element
//       const article = document.createElement('article');

//       // Step 5: Populate the article with project details
//       article.innerHTML = `
//           <h3>${project.title}</h3>
//           <img src="${project.image}" alt="${project.title}">
//           <p>${project.description}</p>
// `     ;

//       // Step 6: Append the article to the container
//       containerElement.appendChild(article);
//   });
// }

export function renderProjects(projects, containerElement, headingLevel = 'h2', totalProjects = projects.length) {
  // Step 1: Clear existing content
  containerElement.innerHTML = '';

  // Step 2: Validate containerElement
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
      console.error('Invalid container element:', containerElement);
      return;
  }

  // Step 3: Validate headingLevel (ensure it's a valid h1-h6 tag)
  if (!/^h[1-6]$/.test(headingLevel)) {
      console.warn(`Invalid heading level "${headingLevel}". Defaulting to h2.`);
      headingLevel = 'h2';
  }

  const projectTitleElement = document.querySelector('.projects-title');
    if (projectTitleElement) {
        projectTitleElement.textContent = `${totalProjects} Projects `;
    }

  // Step 4: Loop through projects and create an article for each
  projects.forEach(project => {
      const article = document.createElement('article');
      article.classList.add('project'); // Add class for styling

      // Create a heading element dynamically
      const heading = document.createElement(headingLevel);
      heading.textContent = project.name;

      // Create a paragraph for the description
      const description = document.createElement('p');
      description.textContent = project.description;

      // Create a paragraph for the year
      const year = document.createElement('p');
      year.textContent = `C. ${project.year}`; // Assuming the project object has a 'year' property
      year.classList.add('project-year'); // Add class for styling

      // Wrap description and year in a div
      const detailsDiv = document.createElement('div');
      detailsDiv.classList.add('project-details'); // Add class for styling
      detailsDiv.appendChild(description);
      detailsDiv.appendChild(year);

      article.innerHTML = `
          <h3>${project.title}</h3>
          <img src="${project.image}" alt="${project.title}">
      `;
      // <p>${project.description}</p>

      // Append heading and description to the article

      // article.appendChild(heading);
      // article.appendChild(description);
      article.appendChild(detailsDiv);

      // Append article to the container
      containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}