'use strict';

const through = require( 'through2' );

const peliasModel = require( 'pelias-model' );

/*
 * Create a stream of Documents from valid, cleaned CSV records
 */
function createDocumentStream(id_prefix, stats) {
  /**
   * Used to track the UID of individual records passing through the stream if
   * there is no HASH that can be used as a more unique identifier.  See
   * `peliasModel.Document.setId()` for information about UIDs.
   */
  let uid = 0;

  return through.obj(
    function write( record, enc, next ){
      const id_number = record.HASH || uid;
      const model_id = `${id_prefix}:${id_number}`;
      uid++;

      console.log(JSON.stringify(record, null, 2));
      try {
        const addrDoc = new peliasModel.Document( 'openaddresses', 'address', model_id )
        .setName( 'default', (record.NUMBER + ' ' + record.STREET) )
        .setCentroid( { lon: record.LON, lat: record.LAT } );
	
 	if (record.UNIT) {
	  addrDoc.setAddress( 'unit', record.UNIT );	
	}
	
        addrDoc.setAddress( 'number', record.NUMBER );

        addrDoc.setAddress( 'street', record.STREET );

        if (record.POSTCODE) {
          addrDoc.setAddress( 'zip', record.POSTCODE );
        }

        if (record.CITY) {
          addrDoc.setMeta( 'OACityRecord', record.CITY);
        }

        if (record.REGION) {
          addrDoc.setMeta( 'OARegionRecord', record.REGION);
        }

        this.push( addrDoc );
      }
      catch ( ex ){
        stats.badRecordCount++;
      }

      next();
    }
  );
}

module.exports = {
  create: createDocumentStream
};
