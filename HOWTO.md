# Joker Camomile - How To

## Documentation

See all Camomile-* documentation at <https://github.com/camomile-project>


## Docker Machines

-   git : branch 'dev'
-   3 layered Docker containers
    -   camomile-web-frontend
    -   camomile-server
    -   Mongo DB
-   Reboot
    -   everything (`docker ps -a`, `docker logs db|camomile|web`)
        1.   `docker stop db && docker start db`
        2.   `docker stop camomile && docker start camomile`
        3.   `docker stop web && docker start web`
        -   <https://github.com/camomile-project/camomile-server#mongodb>
    -   frontend web : script `update-and-start.sh` or `ex.sh`
        - <https://github.com/kLm8/scripts>
-   Rebuild
    -   `export CMML_DB=/data/Camomile/mongodb/`
    -   `docker run -d -v $CMML_DB:/data/db --name database mongo`

    -   `export CMML_MEDIA=/data/Data_collection/2015-02/Corpus_Joker/Data`
    -   `cd` to the folder containing <https://github.com/kLm8/camomile-server>
    -   `docker build -t camomile/api .`
    -   `docker run -d --restart=always -p 32781:3000 -v $CMML_MEDIA:/media:ro -e ROOT_PASSWORD=??? --link database:mongo --name camomile-dev camomile/api`
    
    -   `cd` to the folder containing <https://github.com/kLm8/camomile-web-frontend/tree/dev>
    -   docker build -t klm8/camomile-web-frontend-dev .
    -   `docker run -d --restart=always -p 8080:8070 -e CAMOMILE_API=http://vmjoker.limsi.fr:32781 -e CAMOMILE_LOGIN=??? -e CAMOMILE_PASSWORD=??? --name web-dev klm8/camomile-web-frontend-dev`


-   Dump and Restore
    -   `export CMML_DUMP=/data/backups/`
    -   `docker run -i -t --rm \
         --link database:mongo \
         -v $CMML_DUMP:/dump \
         mongo \
         bash -c 'mongodump --host $MONGO_PORT_27017_TCP_ADDR -o /dump'`
    -   `docker run -i -t --rm \
         --link database:mongo \
         -v $CMML_DUMP:/dump \
         mongo \
         bash -c 'mongorestore --host $MONGO_PORT_27017_TCP_ADDR /dump'`



## Python Client

See doc at <http://camomile-project.github.io/camomile-server/>

``` python
In [1]: from camomile import Camomile

In [2]: client = Camomile('http://vmjoker:32781')

In [3]: client.login('login', 'password')
Out[3]: {u'success': u'Authentication succeeded.'}
```

### Corpus

-   ```python client.createCorpus(...)```
-   ```python client.setCorpusPermissions(...)```

### Layer

-   ```python client.createLayer(...)```
-   ```python client.setLayerPermissions(...)```

### User

-   ```python client.createUser('username', 'password', ROLE)```
        with ROLE = 'user', 'admin', 'read'


## Configuration of Annotation Tracks

1.  Modify file `config.json` and reboot frontend
2.  Non-existing layer(s) will be created by the frontend
3.  Do not forget to ```setLayerPermissions(...)``` to the new layer(s)


## Tips

-   Maj + clic (region in waveform): replay segment
-   Deleting a segment on the frontend will add 'DELETE__' to its data.
    Annotations with the prefix 'DELETE__' can afterwards be deleted 
    permanently using script : 
        ```python deleteSameAnnotations.py```
    What is more, this script will clean the duplicate annotations if
    there are ones.
