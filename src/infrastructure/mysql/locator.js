const
mysql               = require('mysql'),
Db                  = require('@superhero/db'),
AdapterFactory      = require('@superhero/db/adapter/mysql/factory'),
json2sql            = require('json-sql-builder2'),
MysqlRepository     = require('./repository'),
LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Infrastructure
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
    adaptorOptions  = configuration.find('infrastructure/mysql/gateway'),
    filePath        = __dirname + '/sql',
    fileSuffix      = '.sql',
    adapterFactory  = new AdapterFactory(),
    mysqlAdapter    = adapterFactory.create(mysql, adaptorOptions),
    mysqlGateway    = new Db(mysqlAdapter, filePath, fileSuffix),
    repository      = new MysqlRepository(mysqlGateway, json2sql)

    return repository
  }
}

module.exports = MysqlRepositoryLocator
