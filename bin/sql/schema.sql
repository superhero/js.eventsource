SET NAMES utf8;

CREATE DATABASE IF NOT EXISTS `eventsource`;

CREATE TABLE IF NOT EXISTS `eventsource`.`event`
(
  `timestamp` DATETIME(6)   DEFAULT NOW(6)  NOT NULL,
  `pid`       VARCHAR(200)                  NOT NULL,
  `domain`    VARCHAR(200)                  NOT NULL,
  `name`      VARCHAR(200)                  NOT NULL,
  `data`      JSON                              NULL
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;

CREATE INDEX `eventsource_event_timestamp`  ON `eventsource`.`event` (`timestamp`)              USING BTREE;
CREATE INDEX `eventsource_event_pid`        ON `eventsource`.`event` (`pid`(10))                USING BTREE;
CREATE INDEX `eventsource_event_name`       ON `eventsource`.`event` (`domain`(10), `name`(10)) USING BTREE;
