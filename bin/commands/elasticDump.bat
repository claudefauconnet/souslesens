elasticdump --input=http://localhost:9200/artotheque --output=d:\artoThequeAnalyzer.dump --type=analyzer ;
elasticdump --input=http://localhost:9200/artotheque --output=d:\artoThequeMapping.dump --type=mapping ;
elasticdump --input=http://localhost:9200/artotheque --output=d:\artoThequeData.dump --type=data ;




curl -X DELETE http://92.222.116.179:9200/artotheque ;
/var/lib/node/node_modules/elasticdump/bin/elasticdump --output=http://92.222.116.179:9200/artotheque --input=/home/claude/dump/artoThequeAnalyzer.dump --type=analyzer  --limit 500 ;
/var/lib/node/node_modules/elasticdump/bin/elasticdump --output=http://92.222.116.179:9200/artotheque --input=/home/claude/dump/artoThequeMapping.dump --type=mapping --limit 500 ;
/var/lib/node/node_modules/elasticdump/bin/elasticdump --output=http://92.222.116.179:9200/artotheque --input=/home/claude/dump/artoThequeData.dump --type=data  --limit 500 ;



elasticdump \
  --input=http://production.es.com:9200/my_index \
  --output=http://staging.es.com:9200/my_index \
  --type=mapping
elasticdump \
  --input=http://production.es.com:9200/my_index \
  --output=http://staging.es.com:9200/my_index \
  --type=data