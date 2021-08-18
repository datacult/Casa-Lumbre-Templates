# K-Means Clustering & Difference-In-Difference Templates

## General
Each template requires data to be copy and pasted in from the pre-designed template. When copying from a google sheet or Excel file, ```tsv``` should be selected. If the data has been saved as a ```csv``` file, the selection should be changed on the template. 
The required headings for the data are ```city``` followed by any series of dates. The dates provided in the templates are not fixed and can be edited.

Pressing submit on any template will rerun the generation of the visualization, allowing for setting to be adapted and the visualization updated. 

## K-means Clustering
The k-means clustering model helps to 'group' or 'cluster' cities with common attributes together. Assigning the number of clusters to half the total number of cities should result in cities being grouped into pairs. Experimenting with the number of clusters may results in better groupings. 
The best cluster to select for use in an experiment will have a close similarity in depletion data, however higher numbers of depletions will also help with seeing the effects of the experiment.

## Difference-In-Difference
The difference-in-difference tracker is designed to track a 'control' and 'experiment' group. A variance band will show the variation between the two cities **before the start of the experiment**. Variance can be calculated as the maximum variation in any single time period or as the average variation. If the line of the experiment city varies outside of the band after the start of the experiment, this indicates a change in behavior (although this does not necessarily indicate a statistically significant difference).

The 'flatten baseline' checkbox is a secondary view that can help to show the variation of the experiment city purely in relation to the control city (and not overall depletions).