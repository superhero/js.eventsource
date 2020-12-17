const
  mysql               = require('mysql'),
  Db                  = require('@superhero/db'),
  AdapterFactory      = require('@superhero/db/adapter/mysql/factory'),
  SQLBuilder          = require('json-sql-builder2'),
  MysqlRepository     = require('./repository'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Infrastructure
 * @extends {superhero/core/locator/constituent}
 */
class MysqlRepositoryLocator extends LocatorConstituent
{
  /**
   * @returns {MysqlRepository}
   */
  locate()
  {
    const
      configuration   = this.locator.locate('core/configuration'),
      console         = this.locator.locate('core/console'),
      adaptorOptions  = configuration.find('infrastructure/mysql/gateway'),
      filePath        = __dirname + '/sql',
      fileSuffix      = '.sql',
      adapterFactory  = new AdapterFactory(),
      mysqlAdapter    = adapterFactory.create(mysql, adaptorOptions),
      mysqlGateway    = new Db(mysqlAdapter, filePath, fileSuffix),
      json2sql        = new SQLBuilder('MySQL'),
      repository      = new MysqlRepository(mysqlGateway, json2sql, console)

    return repository
  }
}

module.exports = MysqlRepositoryLocator
