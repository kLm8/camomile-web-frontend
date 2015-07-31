# Joker Camomile - How To

## Docker Machines

-   git : branch 'dev'
-   3 layered Docker containers
    -   camomile-web-frontend
    -   camomile-server
    -   Mongo DB
-   Reboot
    -   everything (`docker ps -a`, `docker logs db|camomile|web`)
        1.   `docker start db`
        2.   `docker start camomile`
        3.   `docker start web`
        -   <https://github.com/camomile-project/camomile-server#mongodb>
    -   frontend web : script `update-and-start.sh` or `ex.sh`


## Python Client

See doc at <http://camomile-project.github.io/camomile-server/>

```
In [1]: from camomile import Camomile

In [2]: client = Camomile('http://vmjoker:32781')

In [3]: client.login('login', 'password')
Out[3]: {u'success': u'Authentication succeeded.'}
```

### Corpus

-   client.createCorpus(...)
-   client.setCorpusPermissions(...)

### Layer

-   client.createLayer(...)
-   client.setLayerPermissions(...)

### User

-   client.createUser('username', 'password', ROLE)
        with ROLE = 'user', 'admin', 'read'


## Configuration of Annotation Tracks

1.  Modify file `config.json` and reboot frontend
2.  Non-existing layer(s) will be created by the frontend
3.  Do not forget to setLayerPermissions(...) to the new layer(s)


## Tips

-   Maj + clic (region in waveform): replay segment
-   Deleting a segment on the frontend will add 'DELETE__' to its data.
    Annotations with the prefix 'DELETE__' can afterwards be deleted 
    permanently using script : 
        ```python deleteSameAnnotations.py```
    What is more, this script will clean the duplicate annotations if
    there are ones.
