SET NAMES utf8;

CREATE DATABASE IF NOT EXISTS `eventsource`;

CREATE TABLE IF NOT EXISTS `eventsource`.`event`
(
  `id`        BIGINT                          NOT NULL AUTO_INCREMENT,
  `timestamp` DATETIME(6)   DEFAULT   NOW(6)  NOT NULL,
  `modified`  DATETIME(6)   ON UPDATE NOW(6)      NULL,
  `ppid`      VARCHAR(200)                        NULL,
  `pid`       VARCHAR(200)                    NOT NULL,
  `domain`    VARCHAR(200)                    NOT NULL,
  `name`      VARCHAR(200)                    NOT NULL,
  `data`      JSON                                NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;

CREATE INDEX `eventsource_event_timestamp`  ON `eventsource`.`event` (`timestamp`)  USING BTREE;
CREATE INDEX `eventsource_event_modified`   ON `eventsource`.`event` (`modified`)   USING BTREE;
CREATE INDEX `eventsource_event_ppid`       ON `eventsource`.`event` (`ppid`(10))   USING BTREE;
CREATE INDEX `eventsource_event_pid`        ON `eventsource`.`event` (`pid`(10))    USING BTREE;
CREATE INDEX `eventsource_event_domain`     ON `eventsource`.`event` (`domain`(10)) USING BTREE;
CREATE INDEX `eventsource_event_name`       ON `eventsource`.`event` (`name`(10))   USING BTREE;
