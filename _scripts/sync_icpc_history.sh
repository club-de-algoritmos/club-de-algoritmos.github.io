#! /bin/bash

# Copy high level results
cp ../icpc-mexico-history/analysis/*.md icpc/resultados/

# Delete all files so deletions are synced too
rm _escuela/*.md

# Copy school results
for school_file in ../icpc-mexico-history/analysis/escuela/*.md; do
  base_filename=$(basename "$school_file")
  # Prepend an empty front matter so its recognized as part of the escuelas collection
  cat <(echo -e "---\n---\n") "$school_file" > "_escuela/$base_filename"
done
