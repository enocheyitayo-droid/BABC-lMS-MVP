// Runs the PostgreSQL wire-driver contract against a real PostgreSQL engine in
// the bridge's worker, without hosted credentials or external test services.
exports.types={setTypeParser(){}};
exports.Client=class {
  async connect(){const {PGlite}=await import('@electric-sql/pglite');this.db=new PGlite();}
  on(){}
  async query(sql,params){
    sql=sql.replace('SELECT pg_advisory_xact_lock(174983551)','SELECT 1');
    if(!params?.length){const results=await this.db.exec(sql);return results.map(r=>({rows:r.rows,rowCount:r.affectedRows??0}));}
    const result=await this.db.query(sql,params);return {rows:result.rows,rowCount:result.affectedRows??0};
  }
  async end(){await this.db?.close();}
};
