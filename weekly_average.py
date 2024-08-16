import pandas as pd
import matplotlib.pyplot as plt

# Load the CSV file
file_path = 'new_chess.csv'  # Replace with the path to your CSV file
chess_data = pd.read_csv(file_path)

# Verify the number of rows loaded
print(f"Total rows loaded: {len(chess_data)}")

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

# Filter games that match the top 10 openings, handling non-string values
chess_data['Opening'] = chess_data['Moves'].apply(
    lambda moves: next(
        (top_10_openings[key] for key in top_10_openings if isinstance(moves, str) and moves.startswith(key)),
        'Other'
    )
)

# Check the number of rows processed after filtering
print(f"Total rows after filtering for valid openings: {len(chess_data)}")

# Group by week and opening to count occurrences
opening_counts = chess_data.groupby(['Week', 'Opening']).size().unstack(fill_value=0)

# Calculate the average number of games per week
average_games_per_week = chess_data.groupby('Week').size().mean()

# Calculate the average Elo rating per week
average_elo_per_week = chess_data.groupby('Week')['EloRating'].mean()

# Create a plot with dual y-axes: one for the opening density and one for the Elo rating
fig, ax1 = plt.subplots(figsize=(16, 8))

# Plot the stacked bar chart for openings
opening_counts.plot(kind='bar', stacked=True, colormap='tab10', ax=ax1)
ax1.set_xlabel('Week')
ax1.set_ylabel('Number of Games')
ax1.axhline(y=average_games_per_week, color='red', linestyle='--', label=f'Average Games per Week ({average_games_per_week:.2f})')
ax1.legend(title="Openings", loc='upper left')

# Create a second y-axis for the Elo rating
ax2 = ax1.twinx()
ax2.plot(average_elo_per_week.index, average_elo_per_week, color='black', marker='o', linewidth=2, label='Average Elo Rating')
ax2.set_ylabel('Average Elo Rating')

# Combine the legends from both axes
lines, labels = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines + lines2, labels + labels2, loc='upper right')

plt.title('Density of Openings per Week with Average Elo Rating')
plt.tight_layout()

# Display the plot
plt.show()
