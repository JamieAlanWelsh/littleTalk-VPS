#!/bin/bash

# Generate exercise items for categorisation exercise
# Usage: ./generate-exercise-items.sh /path/to/categories/directory
# 
# Input directory structure:
#   /path/to/categories/
#     ├── farmyard-animals/
#     │   ├── cow.png
#     │   └── pig.png
#     └── exotic-animals/
#         ├── lion.png
#         └── zebra.png

if [ $# -eq 0 ]; then
  echo "Usage: $0 <path-to-categories-directory>"
  echo ""
  echo "Example:"
  echo "  $0 /workspace/static/icons/categorisation/Categorisation"
  exit 1
fi

CATEGORIES_DIR="$1"

if [ ! -d "$CATEGORIES_DIR" ]; then
  echo "Error: Directory '$CATEGORIES_DIR' not found"
  exit 1
fi

# Loop through each subdirectory (each category)
for category_dir in "$CATEGORIES_DIR"/*/; do
  category_name=$(basename "$category_dir")
  
  echo "\"$category_name\": ["
  
  first=true
  
  # Loop through image files in the category
  for image_file in "$category_dir"*.png; do
    if [ -f "$image_file" ]; then
      filename=$(basename "$image_file")
      id="${filename%.*}"  # Remove extension
      
      # Create imageUrl - relative path from static
      imageUrl="/static/icons/categorisation/$category_name/$filename"
      
      # Create label - replace underscores with spaces
      label_text=$(echo "$id" | sed 's/_/ /g')
      label="The $label_text"
      
      if [ "$first" = true ]; then
        first=false
      else
        echo ","
      fi
      
      echo -n "  {
    \"id\": \"$id\",
    \"imageUrl\": \"$imageUrl\",
    \"label\": \"$label\"
  }"
    fi
  done
  
  echo ""
  echo "],"
done
