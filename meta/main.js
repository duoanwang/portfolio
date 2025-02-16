let data = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterplot();
  updateTooltipVisibility(false);
});

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    displayStats();
}


let commits = d3.groups(data, (d) => d.commit);

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        // Each 'lines' array contains all lines modified in this commit
        // All lines in a commit have the same author, date, etc.
        // So we can get this information from the first line
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
  
        // What information should we return about this commit?
        let ret = {
          id: commit,
          url: 'https://github.com/YOUR_REPO/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };

        Object.defineProperty(ret, 'lines', {
            value: lines,
            // What other options do we need to set?
            // Hint: look up configurable, writable, and enumerable
            configurable: false,
            writable: false,
            enumerable: false
      });
      return ret;
    });
}

function displayStats() {
    // Process commits first
    processCommits();

    const statsContainer = d3.select('#stats');
    statsContainer.html(''); // Clear existing content

    // Add a title for the summary
    statsContainer.append('h3').attr('class', 'summary-title').text('Summary');

    // Create the flex container for stats
    const statsRow = statsContainer.append('div').attr('class', 'stats-row');

    // Helper function to append each stat
    function addStat(label, value) {
        const statBlock = statsRow.append('div').attr('class', 'stat-block');
        statBlock.append('div').attr('class', 'stat-label').text(label);
        statBlock.append('div').attr('class', 'stat-value').text(value);
    }

    // Add statistics
    addStat('COMMITS', commits.length);
    addStat('FILES', new Set(data.map(d => d.file)).size);
    addStat('TOTAL LOC', data.length);
    addStat('MAX DEPTH', d3.max(data, d => d.depth));
    addStat('LONGEST LINE', d3.max(data, d => d.length));
    addStat('MAX LINES', d3.max(commits, d => d.totalLines));
}

const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
);

const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
);

const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
let xScale, yScale;

function createScatterplot() {
    // visualization
    const width = 1000;
    const height = 600;

    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([5, 20]);

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots.selectAll('circle').data(sortedCommits).join('circle');


    dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('r', (d) => rScale(d.totalLines)) // Set radius first
    .attr('cx', (d) => {
        const r = rScale(d.totalLines);
        return Math.max(r, Math.min(width - r, xScale(d.datetime)));
      })
      .attr('cy', (d) => {
        const r = rScale(d.totalLines);
        return Math.max(r, Math.min(height - r, yScale(d.hourFrac))); 
    })
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, d) => {
        updateTooltipContent(d);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    })
    .on('mouseleave', function() {
        d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
        updateTooltipContent({});
        updateTooltipVisibility(false); 
    });


    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
      
      // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

// Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

// Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

// Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    brushSelector();
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full'  });
    time.textContent = commit.datetime?.toLocaleString('en', { timeStyle: 'short' });
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
    
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const tooltipBox = tooltip.getBoundingClientRect();
    const padding = 10; // Padding to prevent tooltip from touching edges

    let left = event.clientX + padding;
    let top = event.clientY + padding;

    // Prevent overflow on the right
    if (left + tooltipBox.width > window.innerWidth) {
        left = event.clientX - tooltipBox.width - padding;
    }

    // Prevent overflow on the bottom
    if (top + tooltipBox.height > window.innerHeight) {
        top = event.clientY - tooltipBox.height - padding;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush());
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

let brushSelection = null;

function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) { 
    if (!brushSelection) return false; 
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
    const x = xScale(commit.date); 
    const y = yScale(commit.hourFrac); 
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y; 
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}


function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );

    container.innerHTML = `<div class="breakdown-container"></div>`;
    const breakdownContainer = container.querySelector('.breakdown-container');

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        breakdownContainer.innerHTML += `
            <div class="breakdown-item">
                <div class="breakdown-language">${language}</div>
                <div class="breakdown-lines">${count} <span>lines</span></div>
                <div class="breakdown-percentage">(${formatted})</div>
            </div>
        `;
    }
}
  