# Joker Camomile Frontend - How To

## Docker Machines

-   git : branch 'dev'
-   3 layered machines
    -   Frontend
    -   CAMOMILE Server
    -   Mongo DB
-   Reboot
    -   everything (`docker ps -a`, `docker logs db|camomile|web`)
        -   `docker start db`
        -   `docker start camomile`
        -   `docker start web`
        -   <https://github.com/camomile-project/camomile-server#mongodb>
    -   frontend web : script `update-and-start.sh`

## Configuration

### Add User

In directory 'scripts', see file `config.ini`.

### Configuration of Annotation Tracks

1.  Modify file: `config.json`
2.  Reboot frontend 

### Add medium

In directory 'scripts', see file `config.ini`.

## Python Console 

Install Python client: <https://github.com/camomile-project/camomile-client-python>

    from camomile import Camomile
    client = Camomile('http://camomile.fr/api')
    client.login('username', 'password')
    client.logout()
    client.getCorpora()
    client.createCorpus(...)
    
    client.updateMedium(...)

## Key Shortcuts

Maj + clic : replay segment
