elasticdump --input=http://localhost:9200/artotheque --output=d:\artoThequeAnalyzer.dump --type=analyzer
elasticdump --input=http://localhost:9200/artotheque --output=d:\artoThequeMapping.dump --type=mapping
elasticdump --input=http://localhost:9200/artotheque --output=d:\artoThequeData.dump --type=data

scp d:\artoThequeAnalyzer.dump claude@http://51.255.106.33:./dump/




elasticdump --output=http://92.222.116.179:9200/artotheque --input=./dump/artoThequeAnalyzer.dump --type=analyzer
elasticdump --output=http://92.222.116.179:9200/artotheque --input=./dump/artoThequeMapping.dump --type=mapping
elasticdump --output=http://92.222.116.179:9200/artotheque --input=./dump/artoThequeData.dump --type=data


elasticdump \
  --input=http://production.es.com:9200/my_index \
  --output=http://staging.es.com:9200/my_index \
  --type=mapping
elasticdump \
  --input=http://production.es.com:9200/my_index \
  --output=http://staging.es.com:9200/my_index \
  --type=data