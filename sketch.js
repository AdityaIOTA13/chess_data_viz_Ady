let table;
let points = [];
let margin = 80;
let customFont;
let topOpenings = {
    "e2e4 e7e5 g1f3 b8c6 b1c3": { name: "Vienna Game", color: "#FF5733" },
    "e2e4 e7e5 g1f3 b8c6 f1c4": { name: "Italian Game", color: "#33FF57" },
    "e2e4 d7d5 e4d5 d8d5 b1c3": { name: "Scandinavian Defense", color: "#3357FF" },
    "e2e4 e7e5 g1f3 d7d6 b1c3": { name: "Philidor Defense", color: "#FF33A1" },
    "e2e4 e7e5 g1f3 b8c6 d2d4": { name: "Scotch Game", color: "#FFBD33" },
    "e2e4 e7e5 g1f3 b8c6 f1b5": { name: "Ruy Lopez", color: "#33FFF3" },
    "e2e4 e7e5 g1f3 g8f6 b1c3": { name: "Four Knights Game", color: "#FF5733" },
    "e2e4 e7e5 g1f3 d8f6 b1c3": { name: "Petrov Defense", color: "#75FF33" },
    "e2e4 e7e5 d2d4 e5d4 d1d4": { name: "Center Game", color: "#5733FF" },
    "e2e4 c7c5 g1f3 b8c6 b1c3": { name: "Sicilian Defense", color: "#FF33FF" }
};

let images = {};
let gameImages = [];
let selectedOpening = null;
let imageVisible = false;
let hoveredOpening = null;
let clickedGameIndex = null;

function preload() {
    customFont = loadFont('Helvetica.ttf'); // Replace with your font file name
    table = loadTable('new_chess.csv', 'csv', 'header', onLoad, onError);

    // Load all images for the openings using the opening names
    for (let key of Object.keys(topOpenings)) {
        let openingName = topOpenings[key].name;
        let imagePath = `${openingName}.png`; // Image names like "Vienna Game.png"
        images[openingName] = loadImage(imagePath, 
            () => console.log(`Loaded image: ${imagePath}`), // Success callback
            () => console.error(`Failed to load image: ${imagePath}`) // Error callback
        );
    }

    // Load heatmap images for each game
    for (let i = 1; i <= 500; i++) {
        let gameImagePath = `game_${i}_heatmap.png`;
        gameImages.push(loadImage(gameImagePath, 
            () => console.log(`Loaded game image: ${gameImagePath}`), // Success callback
            () => console.error(`Failed to load game image: ${gameImagePath}`) // Error callback
        ));
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);

    if (table.getRowCount() === 0) {
        console.error('No data loaded.');
        return;
    }

    // Process and filter data
    for (let i = 0; i < table.getRowCount(); i++) {
        let date = table.getString(i, 'Date');
        let eloRating = table.getNum(i, 'EloRating');
        let moves = table.getString(i, 'Moves');
        
        let matchedOpening = Object.keys(topOpenings).find(opening => moves.startsWith(opening));
        if (matchedOpening) {
            let formattedDate = parseDate(date);
            points.push({
                date: formattedDate,
                eloRating: eloRating,
                opening: topOpenings[matchedOpening].name,
                color: topOpenings[matchedOpening].color,
                index: i // Store the index to match the correct game image
            });
        }
    }

    points.sort((a, b) => a.date - b.date);

    for (let i = 0; i < points.length; i++) {
        points[i].x = map(i, 0, points.length - 1, margin, width - margin);
        points[i].y = map(points[i].eloRating, 700, 1350, height - margin, margin); // Adjusted y-axis range
    }
}

function drawGrid() {
  stroke(200); // Light gray grid lines
  strokeWeight(1);
  // Draw horizontal grid lines every 50 Elo points
  for (let y = 700; y <= 1350; y += 50) {
      let labelY = map(y, 700, 1350, height - margin, margin);
      line(margin, labelY, width - margin, labelY);
  }

  // Draw vertical grid lines
  for (let i = 0; i < points.length; i += Math.floor(points.length / 10)) {
      line(points[i].x, margin, points[i].x, height - margin);
  }
}

function draw() {
  if (imageVisible && (selectedOpening || clickedGameIndex !== null)) {
      background(0, 127); // Black background with 50% opacity
      drawImagePopup();
      return;
  }

  background(255);
  stroke(0);
  noFill();

  // Draw x-axis and y-axis
  strokeWeight(1);
  line(margin, height - margin, width - margin, height - margin); // x-axis
  line(margin, margin, margin, height - margin); // y-axis

  // Draw grid lines (before drawing points)
  drawGrid();

  // Draw axis labels
  fill(0);
  textFont('Helvetica');
  textAlign(CENTER);
  textSize(14);

  // Draw x-axis labels (dates)
  for (let i = 0; i < points.length; i += Math.floor(points.length / 10)) {
      let label = points[i].date.toISOString().split('T')[0];
      noStroke();
      textAlign(CENTER);
      text(label, points[i].x, height - margin / 2);
  }

  // Draw y-axis labels (Elo Rating)
  for (let y = 700; y <= 1350; y += 100) {
      let labelY = map(y, 700, 1350, height - margin, margin);
      noStroke();
      textAlign(RIGHT);
      text(y, margin - 10, labelY);
      line(margin - 5, labelY, margin + 5, labelY);
  }

  // Determine the currently hovered opening from the legend
  hoveredOpening = getHoveredOpening();

  // Draw the line connecting the Elo ratings
  beginShape();
  stroke(0);
  strokeWeight(2);
  noFill();
  for (let point of points) {
      if (!hoveredOpening || point.opening === hoveredOpening) {
          vertex(point.x, point.y);
      }
  }
  endShape();

  // Draw points with hover highlighting
  let closestPoint = null;
  let minDistance = Infinity;
  for (let point of points) {
      if (!hoveredOpening || point.opening === hoveredOpening) {
          fill(point.color);
          stroke(0);
          strokeWeight(1);
          ellipse(point.x, point.y, 8, 8);

          // Calculate the distance to the cursor
          let d = dist(mouseX, mouseY, point.x, point.y);
          if (d < minDistance && d < 20) { // Adjust threshold as needed
              minDistance = d;
              closestPoint = point;
          }
      }
  }

  // Show hover information only for the closest point
  if (closestPoint) {
      // Calculate the width of the text dynamically
      let textContent = `${closestPoint.eloRating} (${closestPoint.opening})`;
      let textWidthPadding = 10; // Padding for the text inside the rectangle
      let textHeight = 20; // Fixed height for the text

      // Calculate the dimensions of the rectangle
      let rectWidth = textWidth(textContent) + textWidthPadding * 2;
      let rectHeight = textHeight;

      // Draw the rectangle with a white fill and black border
      fill(255);
      stroke(0);
      strokeWeight(1);
      rect(closestPoint.x + 15, closestPoint.y - 30, rectWidth, rectHeight, 5); // Adjust rectangle position as needed

      // Draw the text on top of the rectangle
      fill(0);
      noStroke();
      textAlign(LEFT, CENTER);
      textSize(14);
      text(textContent, closestPoint.x + 15 + textWidthPadding, closestPoint.y - 20);
  }

  drawLegend();
}

function drawLegend() {
    let legendX = margin;
    let legendY = margin / 2;
    let legendSpacing = 120;

    noStroke();
    textFont(customFont);
    textAlign(LEFT, CENTER);
    textSize(8);
    textStyle(NORMAL);

    for (let [index, key] of Object.keys(topOpenings).entries()) {
        let opening = topOpenings[key];
        fill(opening.color);
        rect(legendX + index * legendSpacing, legendY, 15, 15);
        fill(0);
        text(opening.name, legendX + index * legendSpacing + 25, legendY + 7.5);
    }
}

function drawImagePopup() {
  let popupWidth, popupHeight;
  let x, y;

  if (selectedOpening && images[selectedOpening]) {
      // Set size for opening-related images (from the legend)
      popupWidth = 800;
      popupHeight = 400;
  } else if (clickedGameIndex !== null && gameImages[clickedGameIndex]) {
      // Set size for game-specific images (from graph points)
      popupWidth = 400;
      popupHeight = 400;
  }

  // Calculate the centered position
  x = (width - popupWidth) / 2;
  y = (height - popupHeight) / 2;

  if (selectedOpening && images[selectedOpening]) {
      // Draw opening-related image
      let img = images[selectedOpening];
      image(img, x, y, popupWidth, popupHeight);
  } else if (clickedGameIndex !== null && gameImages[clickedGameIndex]) {
      // Draw game-specific heatmap image
      let img = gameImages[clickedGameIndex];
      image(img, x, y, popupWidth, popupHeight);
  }
  noTint(); // Reset tint in case it was applied earlier
}


function mousePressed() {
    if (imageVisible) {
        // If the image is visible, hide it on click
        imageVisible = false;
        selectedOpening = null;
        clickedGameIndex = null;
    } else {
        // Check if a legend item was clicked
        let legendX = margin;
        let legendY = margin / 2;
        let legendSpacing = 120;

        for (let [index, key] of Object.keys(topOpenings).entries()) {
            let opening = topOpenings[key];
            let rectX = legendX + index * legendSpacing;
            let rectY = legendY;
            if (mouseX > rectX && mouseX < rectX + 15 && mouseY > rectY && mouseY < rectY + 15) {
                // Show the corresponding image based on the opening name
                selectedOpening = opening.name;
                imageVisible = true;
                return;
            }
        }

        // Check if a point on the graph was clicked
        for (let point of points) {
            let d = dist(mouseX, mouseY, point.x, point.y);
            if (d < 10) { // Adjust threshold as needed
                clickedGameIndex = point.index;
                imageVisible = true;
                return;
            }
        }
    }
}

function getHoveredOpening() {
    let legendX = margin;
    let legendY = margin / 2;
    let legendSpacing = 120;

    for (let [index, key] of Object.keys(topOpenings).entries()) {
        let opening = topOpenings[key];
        let rectX = legendX + index * legendSpacing;
        let rectY = legendY;
        if (mouseX > rectX && mouseX < rectX + 15 && mouseY > rectY && mouseY < rectY + 15) {
            return opening.name;
        }
    }
    return null;
}

function parseDate(dateStr) {
    let parts = dateStr.split('/');
    return new Date(`20${parts[2]}-${parts[1]}-${parts[0]}`);
}

function onLoad() {
    console.log('CSV loaded successfully.');
}

function onError() {
    console.error('Error loading the CSV file.');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    setup();
}
