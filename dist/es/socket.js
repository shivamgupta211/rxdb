import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import * as util from './util';
import RxChangeEvent from './rx-change-event';
import RxBroadcastChannel from './rx-broadcast-channel';

var EVENT_TTL = 5000; // after this age, events will be deleted
var PULL_TIME = RxBroadcastChannel.canIUse() ? EVENT_TTL / 2 : 200;

import { Subject } from 'rxjs/Subject';
import { filter } from 'rxjs/operators/filter';

var Socket = function () {
    function Socket(database) {
        _classCallCheck(this, Socket);

        this._destroyed = false;
        this.database = database;
        this.token = database.token;
        this.subs = [];

        this.pullCount = 0;
        this.pull_running = false;
        this.lastPull = new Date().getTime();
        this.receivedEvents = {};

        this.bc = RxBroadcastChannel.create(this.database, 'socket');
        this.messages$ = new Subject();
    }

    /**
     * @return {Observable}
     */


    Socket.prototype.prepare = function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
            var _this = this;

            return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            // create socket-collection
                            this.pouch = this.database._spawnPouchDB('_socket', 0, {
                                auto_compaction: false, // this is false because its done manually at .pull()
                                revs_limit: 1
                            });

                            // pull on BroadcastChannel-message
                            if (this.bc) {
                                this.subs.push(this.bc.$.pipe(filter(function (msg) {
                                    return msg.type === 'pull';
                                })).subscribe(function () {
                                    return _this.pull();
                                }));
                            }

                            // pull on intervall
                            _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                                return _regeneratorRuntime.wrap(function _callee$(_context) {
                                    while (1) {
                                        switch (_context.prev = _context.next) {
                                            case 0:
                                                if (_this._destroyed) {
                                                    _context.next = 8;
                                                    break;
                                                }

                                                _context.next = 3;
                                                return util.promiseWait(PULL_TIME);

                                            case 3:
                                                if (!(_this.messages$.observers.length > 0 && !_this._destroyed)) {
                                                    _context.next = 6;
                                                    break;
                                                }

                                                _context.next = 6;
                                                return _this.pull();

                                            case 6:
                                                _context.next = 0;
                                                break;

                                            case 8:
                                            case 'end':
                                                return _context.stop();
                                        }
                                    }
                                }, _callee, _this);
                            }))();

                            return _context2.abrupt('return', this);

                        case 4:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        function prepare() {
            return _ref.apply(this, arguments);
        }

        return prepare;
    }();

    /**
     * write the given event to the socket
     */


    Socket.prototype.write = function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(changeEvent) {
            var _this2 = this;

            var socketDoc;
            return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            socketDoc = changeEvent.toJSON();

                            delete socketDoc.db;

                            // TODO find a way to getAll on local documents
                            //  socketDoc._id = '_local/' + util.fastUnsecureHash(socketDoc);
                            socketDoc._id = '' + util.fastUnsecureHash(socketDoc) + socketDoc.t;
                            _context3.next = 5;
                            return this.database.lockedRun(function () {
                                return _this2.pouch.put(socketDoc);
                            });

                        case 5:
                            _context3.t0 = this.bc;

                            if (!_context3.t0) {
                                _context3.next = 9;
                                break;
                            }

                            _context3.next = 9;
                            return this.bc.write('pull');

                        case 9:
                            return _context3.abrupt('return', true);

                        case 10:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        }));

        function write(_x) {
            return _ref3.apply(this, arguments);
        }

        return write;
    }();

    /**
     * get all docs from the socket-collection
     */


    Socket.prototype.fetchDocs = function () {
        var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
            var _this3 = this;

            var result;
            return _regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            _context4.next = 2;
                            return this.database.lockedRun(function () {
                                return _this3.pouch.allDocs({
                                    include_docs: true
                                });
                            });

                        case 2:
                            result = _context4.sent;
                            return _context4.abrupt('return', result.rows.map(function (row) {
                                return row.doc;
                            }));

                        case 4:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));

        function fetchDocs() {
            return _ref4.apply(this, arguments);
        }

        return fetchDocs;
    }();

    /**
     * delete the document from the socket-database.
     * This mutes errors because they are likely but not bad on multiInstance
     * @param  {any} doc
     * @return {Promise<boolean>} success
     */


    Socket.prototype.deleteDoc = function () {
        var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(doc) {
            var _this4 = this;

            var success;
            return _regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                    switch (_context5.prev = _context5.next) {
                        case 0:
                            success = true;
                            _context5.prev = 1;
                            _context5.next = 4;
                            return this.database.lockedRun(function () {
                                return _this4.pouch.remove(doc);
                            });

                        case 4:
                            _context5.next = 9;
                            break;

                        case 6:
                            _context5.prev = 6;
                            _context5.t0 = _context5['catch'](1);

                            success = false;

                        case 9:
                            return _context5.abrupt('return', success);

                        case 10:
                        case 'end':
                            return _context5.stop();
                    }
                }
            }, _callee5, this, [[1, 6]]);
        }));

        function deleteDoc(_x2) {
            return _ref5.apply(this, arguments);
        }

        return deleteDoc;
    }();

    /**
     * runs a cleanup to delete the given docs
     * @param  {array} docsData docs to be deleted
     * @return {void}
     */


    Socket.prototype._cleanupDocs = function _cleanupDocs(docsData) {
        var _this5 = this;

        // delete docs on idle
        docsData.forEach(function (docData) {
            _this5.database.requestIdlePromise().then(function () {
                if (_this5._destroyed) return;
                _this5.deleteDoc(docData);
            });
        });

        // run a compaction if more than one doc was deleted
        if (docsData.length > 0) {
            this.database.requestIdlePromise().then(function () {
                if (_this5._destroyed) return;
                _this5.database.lockedRun(function () {
                    return _this5.pouch.compact();
                });
            });
        }
    };

    /**
     * grab all new events from the socket-pouchdb
     * and throw them into this.messages$
     */


    Socket.prototype.pull = function () {
        var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
            var _this6 = this;

            var minTime, docs, maxAge, delDocs;
            return _regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            if (!this.isPulling) {
                                _context6.next = 3;
                                break;
                            }

                            this._repullAfter = true;
                            return _context6.abrupt('return', false);

                        case 3:
                            this.isPulling = true;
                            this.pullCount++;

                            // w8 for idle-time because this is a non-prio-task
                            _context6.next = 7;
                            return util.requestIdlePromise(EVENT_TTL / 2);

                        case 7:
                            if (!this._destroyed) {
                                _context6.next = 9;
                                break;
                            }

                            return _context6.abrupt('return');

                        case 9:
                            minTime = this.lastPull - 100; // TODO evaluate this value (100)

                            _context6.next = 12;
                            return this.fetchDocs();

                        case 12:
                            docs = _context6.sent;

                            if (!this._destroyed) {
                                _context6.next = 15;
                                break;
                            }

                            return _context6.abrupt('return');

                        case 15:
                            docs.filter(function (doc) {
                                return doc.it !== _this6.token;
                            }) // do not get events emitted by self
                            // do not get events older than minTime
                            .filter(function (doc) {
                                return doc.t > minTime;
                            })
                            // sort timestamp
                            .sort(function (a, b) {
                                if (a.t > b.t) return 1;
                                return -1;
                            }).map(function (doc) {
                                return RxChangeEvent.fromJSON(doc);
                            })
                            // make sure the same event is not emitted twice
                            .filter(function (cE) {
                                if (_this6.receivedEvents[cE.hash]) return false;
                                return _this6.receivedEvents[cE.hash] = new Date().getTime();
                            })
                            // prevent memory leak of this.receivedEvents
                            .filter(function (cE) {
                                return setTimeout(function () {
                                    return delete _this6.receivedEvents[cE.hash];
                                }, EVENT_TTL * 3);
                            })
                            // emit to messages
                            .forEach(function (cE) {
                                return _this6.messages$.next(cE);
                            });

                            if (!this._destroyed) {
                                _context6.next = 18;
                                break;
                            }

                            return _context6.abrupt('return');

                        case 18:

                            // delete old documents
                            maxAge = new Date().getTime() - EVENT_TTL;
                            delDocs = docs.filter(function (doc) {
                                return doc.t < maxAge;
                            });

                            this._cleanupDocs(delDocs);
                            this.lastPull = new Date().getTime();

                            this.isPulling = false;
                            if (this._repull) {
                                this._repull = false;
                                this.pull();
                            }
                            return _context6.abrupt('return', true);

                        case 25:
                        case 'end':
                            return _context6.stop();
                    }
                }
            }, _callee6, this);
        }));

        function pull() {
            return _ref6.apply(this, arguments);
        }

        return pull;
    }();

    Socket.prototype.destroy = function () {
        var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7() {
            return _regeneratorRuntime.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            this._destroyed = true;
                            this.subs.map(function (sub) {
                                return sub.unsubscribe();
                            });
                            this.bc && this.bc.destroy();

                        case 3:
                        case 'end':
                            return _context7.stop();
                    }
                }
            }, _callee7, this);
        }));

        function destroy() {
            return _ref7.apply(this, arguments);
        }

        return destroy;
    }();

    _createClass(Socket, [{
        key: '$',
        get: function get() {
            if (!this._$) this._$ = this.messages$.asObservable();
            return this._$;
        }
    }]);

    return Socket;
}();

/**
 * creates a socket
 * @return {Promise<Socket>}
 */


export function create(database) {
    var socket = new Socket(database);
    return socket.prepare();
}

export { EVENT_TTL, PULL_TIME };

export default {
    create: create,
    EVENT_TTL: EVENT_TTL,
    PULL_TIME: PULL_TIME
};