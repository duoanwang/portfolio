import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


// Define SVG and legend elements
const svg = d3.select('svg');
const legend = d3.select('.legend');

let selectedIndex = -1;

// Function to render the pie chart and legend
function renderPieChart(projectsGiven) {
    // Clear existing paths and legends
    svg.selectAll('path').remove();
    legend.selectAll('li').remove();
  
    // Re-calculate rolled data
    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length, // Count projects per year
      (d) => d.year // Group by year
    );
  
    // Re-calculate data for the pie chart
    let newData = newRolledData.map(([year, count]) => ({
      value: count,
      label: year,
    }));
  
    // Re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) =>
      d3.arc().innerRadius(0).outerRadius(50)(d)
    );
  
    // Function to handle selection toggle
    function toggleSelection(idx) {
        selectedIndex = selectedIndex === idx ? -1 : idx;
      
        // Update wedge highlighting
        svg.selectAll('path')
          .classed('selected', (_, i) => selectedIndex === i);
      
        // Update legend highlighting
        legend.selectAll('li')
          .classed('selected', (_, i) => selectedIndex === i);
      
        // Filter and render projects based on selection
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          const selectedYear = newData[selectedIndex].label;
          const filteredProjects = projects.filter(project => project.year == selectedYear);
      
          renderProjects(filteredProjects, projectsContainer, 'h2', projects.length);
        }
      }
      
  
    // Update paths and legends
    newArcs.forEach((arc, idx) => {
      // Append paths to the SVG
      svg
      .append('path')
      .attr('d', arc)
      .attr('style', `--color:${d3.schemeTableau10[idx % 10]}`) // Set color via CSS variable
      .attr('class', 'wedge') // Use class for default styling
      .on('click', () => toggleSelection(idx));
  
      // Append legend items
      legend
        .append('li')
        .attr('class', `legend-item ${idx === selectedIndex ? 'selected' : ''}`)
        .attr('style', `--color:${d3.schemeTableau10[idx % 10]}`)
        .html(
          `<span class="swatch"></span> ${newData[idx].label} <em>(${newData[idx].value})</em>`
        )
        .on('click', () => toggleSelection(idx)); // Toggle selection on legend click
    });
  }
  
  // Call this function on page load to render the initial pie chart
  renderPieChart(projects);
  
  // Search bar functionality
  let searchInput = document.querySelector('.searchBar');
  searchInput.addEventListener('input', (event) => {
    let query = event.target.value.toLowerCase();
    let filteredProjects = projects.filter((project) =>
      Object.values(project).join('\n').toLowerCase().includes(query)
    );
  
    // Reset selection if filtered data doesn't contain the selected index
    if (selectedIndex !== -1 && selectedIndex >= filteredProjects.length) {
      selectedIndex = -1;
    }
  
    // Re-render projects and pie chart
    renderProjects(filteredProjects, projectsContainer, 'h2', projects.length);
    renderPieChart(filteredProjects);
  });