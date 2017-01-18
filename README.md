# Portable Flicka Command Line Interface

Demo project that demonstrates how to download Flickr photos, ideal for
your own personal backups.

To run, create script file named run.sh with a contents similar to this one:

```bash
export FLICKR_USERNAME="asdfasdfasdf"
export FLICKR_API_KEY="ASDFASDFASDF"
export FLICKR_API_SECRET="ASDFASDFASDF"
export FLICKR_USER_ID="ASDFASDFASDF"
#export FLICKR_ACCESS_TOKEN="ASDFASDFASDF"
#export FLICKR_ACCESS_TOKEN_SECRET="ASDFASDF"

node index.js

```

On first run, the app will authenticate against your flickr account. Once succcessfully authenticated
you will get the ACCESS_TOKEN ACCESS_TOKEN_SECRET.

Uncomment the last two exports, and put the values there.

# License
Licensed under the MIT License

Copyright Luis Lobo Borobia (c) 2017