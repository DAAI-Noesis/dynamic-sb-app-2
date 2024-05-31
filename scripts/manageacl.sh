 #!/bin/sh

. ./scripts/loadenv.sh

echo "Running manageacl.py. Arguments to script: $@"
  #./.venv/bin/python ./scripts/manageacl.py --search-service "$AZURE_SEARCH_SERVICE" --index "$AZURE_SEARCH_INDEX" $@

  ./scripts/.venv/bin/python ./scripts/manageacl.py --search-service "$AZURE_SEARCH_SERVICE" --index "$AZURE_SEARCH_INDEX" --index_t1 "$AZURE_SEARCH_INDEX_T1" --index_t2 "$AZURE_SEARCH_INDEX_T2" --index_t3 "$AZURE_SEARCH_INDEX_T3" $@