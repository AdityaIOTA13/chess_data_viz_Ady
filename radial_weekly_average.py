import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import os

# Load the CSV file
file_path = 'radial_data.csv'  # Replace with the path to your CSV file
chess_data = pd.read_csv(file_path)

# Convert the 'Date' column to datetime format
chess_data['Date'] = pd.to_datetime(chess_data['Date'], format='%d/%m/%y')

# Add a column for the week of the year
chess_data['Week'] = chess_data['Date'].dt.isocalendar().week

# Define the top 10 openings
top_10_openings = {
    "e2e4 e7e5 g1f3 b8c6 b1c3": "Vienna Game",
    "e2e4 e7e5 g1f3 b8c6 f1c4": "Italian Game",
    "e2e4 d7d5 e4d5 d8d5 b1c3": "Scandinavian Defense",
    "e2e4 e7e5 g1f3 d7d6 b1c3": "Philidor Defense",
    "e2e4 e7e5 g1f3 b8c6 d2d4": "Scotch Game",
    "e2e4 e7e5 g1f3 b8c6 f1b5": "Ruy Lopez",
    "e2e4 e7e5 g1f3 g8f6 b1c3": "Four Knights Game",
    "e2e4 e7e5 g1f3 d8f6 b1c3": "Petrov Defense",
    "e2e4 e7e5 d2d4 e5d4 d1d4": "Center Game",
    "e2e4 c7c5 g1f3 b8c6 b1c3": "Sicilian Defense"
}

# Filter games that match the top 10 openings only
chess_data['Opening'] = chess_data['Moves'].apply(
    lambda moves: next(
        (top_10_openings[key] for key in top_10_openings if isinstance(moves, str) and moves.startswith(key)),
        None  # Exclude "Other"
    )
)

# Remove rows where 'Opening' is None (i.e., not in the top 10)
chess_data = chess_data.dropna(subset=['Opening'])

# Group by week and opening to count occurrences
opening_counts = chess_data.groupby(['Week', 'Opening']).size().unstack(fill_value=0)

# Create and save radial diagrams for each opening
output_dir = 'radial_charts'  # Directory to save the charts
os.makedirs(output_dir, exist_ok=True)  # Create the directory if it doesn't exist

for opening in opening_counts.columns:
    # Convert to polar coordinates for a radial bar chart
    angles = np.linspace(0, 2 * np.pi, len(opening_counts), endpoint=False).tolist()
    angles += angles[:1]  # Complete the circle

    # Plotting the radial chart
    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw={'projection': 'polar'})

    # Add bars for the specific opening
    values = opening_counts[opening].tolist()
    values += values[:1]  # Complete the circle
    ax.fill(angles, values, alpha=0.25, label=opening)
    ax.plot(angles, values, linewidth=2)

    # Customize the chart
    ax.set_theta_offset(np.pi / 2)  # Rotate the chart to start at the top
    ax.set_theta_direction(-1)  # Reverse the direction of the angles
    ax.set_xticks(angles[:-1])  # Label each segment
    ax.set_xticklabels([f"Week {i}" for i in opening_counts.index])

    # Add a title and legend
    plt.title(f'Radial Chart: Density of {opening} per Week', size=16)
    plt.legend(loc='upper right', bbox_to_anchor=(1.1, 1.1))

    # Save the chart as an image
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, f'{opening}_radial_chart.png'))
    plt.close()

# Create a radial chart for the average rating per week with a range of 800 to 1100
average_elo_per_week = chess_data.groupby('Week')['EloRating'].mean()

# Convert to polar coordinates for a radial chart
angles = np.linspace(0, 2 * np.pi, len(average_elo_per_week), endpoint=False).tolist()
angles += angles[:1]  # Complete the circle

# Plotting the radial chart for average Elo rating with the range 800 to 1100
fig, ax = plt.subplots(figsize=(10, 10), subplot_kw={'projection': 'polar'})

# Add bars for the average Elo rating
values = average_elo_per_week.tolist()
values += values[:1]  # Complete the circle
ax.fill(angles, values, alpha=0.25, label='Average Elo Rating')
ax.plot(angles, values, linewidth=2, color='black')

# Customize the chart
ax.set_theta_offset(np.pi / 2)  # Rotate the chart to start at the top
ax.set_theta_direction(-1)  # Reverse the direction of the angles
ax.set_xticks(angles[:-1])  # Label each segment
ax.set_xticklabels([f"Week {i}" for i in average_elo_per_week.index])

# Set the y-axis range from 800 to 1100
ax.set_ylim(800, 1100)

# Add a title and legend
plt.title('Radial Chart: Average Elo Rating per Week (800 to 1100)', size=16)
plt.legend(loc='upper right', bbox_to_anchor=(1.1, 1.1))

# Save the chart as an image
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'average_elo_rating_radial_chart_800_1100.png'))
plt.close()

print(f"Radial charts saved in the '{output_dir}' directory.")
