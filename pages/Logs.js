/**
 * @jsx React.DOM
 */


var React = require('react');
var $ = require('jquery');
require('../libs/bootstrap-datepicker');
var Moment = require('moment');
var Select2 = require('select2');
var extend = require('extend');
var Router = require('react-router');
var _ = require('lodash');
var RB = require('react-bootstrap');
var Button = RB.Button;
var Link = Router.Link;
var Well = RB.Well;
var FixedDataTable = require('fixed-data-table');
var Table = FixedDataTable.Table;
var Column = FixedDataTable.Column;

/* components */
var Log = require('../components/Log');
var DatePicker = require('../components/DatePicker');
var LoadingMask = require('../components/LoadingMask');
var Notify = require('../components/Notify');
var Tag = require('../components/Tag');
var EasyPieChart = require('../components/charts/EasyPie');
var CalendarHeatMap = require('../components/charts/CalendarHeatMap');
var DateRangePicker = require('../components/DateRangePicker');


/* utils */
var DataAPI = require('../utils/DataAPI');
var Util = require('../utils/Util');
var TIME_FORMAT = "HH:mm";
var DATE_FORMAT = Util.DATE_FORMAT;


/**configs*/
var config = require('../conf/config');
var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};
var  CHART_HEIGHT = 180;

var Logs = React.createClass({

    getInitialState: function () {
        this._filterParams = {};
        var startDate = new Moment().startOf('year').toDate();
        var endDate = new Moment().toDate();
        return {
            logs: null,
            tags: [],
            classes: [],
            projects: [],
            tasks: [],
            versions: [],
            totalTime: null,
            tagOperatorAnd: false,
            logLoaded: true,
            startDate: startDate,
            endDate: endDate
        };
    },

    render: function () {
        var emptyLogs = _.isEmpty(this.state.logs);
        var totalTime = this.state.totalTime;
        var sumTime;
        if (!emptyLogs) {
            sumTime = this.state.logs.reduce(function (sum, log) { return sum + log.len;}, 0);
        }
        return (
            <div className="ltt_c-page ltt_c-page-logs">
                {this.renderFilters()}
                { !emptyLogs ?
                <div className="Grid charts Grid-gutters" style={{height:CHART_HEIGHT}}>
                    <div className="totalTimePercent ltt-box-shadow" style={{width: 150}}>
                        <div className="time">{Util.displayTime(sumTime)}</div>
                        {totalTime > 0 ? <EasyPieChart size={110} value={sumTime} total={totalTime}/> : null }
                    </div>
                    <div className="Grid-cell calendarHeatMap">
                        <CalendarHeatMap
                            className="ltt-box-shadow"
                            getData={this.loadCalendarHeatMapData}
                            empty="no data"
                            ref="calendarHeatMap"
                            filled="{date} {count}分钟"/>
                    </div>
                </div>
                : null}
                <div className="ltt_c-page-logs-list" ref="list">
                    {this.renderLogs()}
                    <LoadingMask loaded={this.state.logLoaded}/>
                </div>
            </div>
        );
    },

    renderLogs: function () {
        var logs = this.state.logs;
        if (logs && logs.length > 0) {
            var $tableContaner = $(this.refs.list.getDOMNode());
            var width = $tableContaner.width();
            var height = $tableContaner.height();
            return <LogsTable logs={logs} height={height} width={width}/>
        } else if (!logs){
            return <Well className="align-center MT-20">通过条件查找日志</Well>
        } else {
            return <Well className="align-center MT-20">找不到日志!</Well>
        }
    },

    renderTimeline: function () {
        this.refs.timeline.getDOMNode().innerHTML = '';
        createStoryJS({
            type:       'timeline',
            width:      '800',
            height:     '600',
            source:     this.toTimelineData(this.state.logs),
            embed_id:   "ltt_c-page-logs-timeline"
        });
    },

    toTimelineData: function (logs) {
        var timeLineObj = {
            timeline: {
                "headline": "Timeline",
                "type":"default",
                "text":"<p>" + this._selectTags.join(', ') + "</p>",
                "asset": {
                    "media":"http://yourdomain_or_socialmedialink_goes_here.jpg",
                    "credit":"Show your activity timeline",
                    "caption":""
                },
                /*"era": [ //era 表示一个时间段
                    {
                        "startDate":"2015,6,10",
                        "endDate":"2015,12,11",
                        "headline":"这是什么？",
                        "text":"不知道呀",
                        "tag":"This is Optional"
                    }
                ]*/
            }
        };

        timeLineObj.timeline.date = logs.map(function (log) {
            return {
                "startDate": log.start,
                "endDate": log.end,
                "headline": log.tags.join(","),
                "text": log.content,
                "tag": log.tags.join(","),
                "asset": {
                    "credit":"what the hell",
                    "caption":"do him do him"
                }
            };
        });
        return timeLineObj;
    },


    /*onDateChange: function (date) {
        var that = this;
        this.setFilter({
            start: new Moment(date).startOf('day').toDate(),
            end: new Moment(date).endOf('day').toDate(),
        });
        this.loadLogs();
    },*/


    renderFilters: function () {
        return (
            <div className="ltt_c-page-logs-filters">
                <div className="Grid">
                    <div className="ltt_c-page-logs-filtersdateRange">
                         <DateRangePicker ref="dateRange" start={this.state.startDate} end={this.state.endDate}
                            onDateRangeChange={this.onDateRangeChange}/>
                    </div>
                    <div className="Grid-cell Grid">
                        <label className="filter-label">Class:</label>
                        <select className="filter-input" ref="classFilter">
                            <option></option>
                            {this.state.classes.map(function (cls) {
                                return <option value={cls._id}>{cls.name}</option>
                            })}
                        </select>
                    </div>
                    <div className="Grid-cell Grid">
                        <label className="filter-label">Project:</label>
                        <select className="filter-input" ref="projectFilter">
                            <option></option>
                            {this.state.projects.map(function (project) {
                                return <option value={project.name}>{project.name}</option>
                            })}
                        </select>
                    </div>
                    <div className="Grid-cell Grid">
                        <label className="filter-label">Version:</label>
                        <select className="filter-input" ref="versionFilter">
                            <option></option>
                            {this.state.versions.map(function (item) {
                                return <option value={item.name}>{item.name}</option>
                            })}
                        </select>
                    </div>
                    <div className="Grid-cell Grid">
                        <label className="filter-label">Task:</label>
                        <select className="filter-input" ref="taskFilter">
                            <option></option>
                        {this.state.tasks.map(function (item) {
                            return <option value={item.name}>{item.name}</option>
                        })}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="filter-label">Tags:</label>
                    <select className="filter-input filter-tags" ref="tagFilter" multiple="multiple">
                        {this.state.tags.map(function (tag) {
                            return <option value={tag.name}>{tag.name}</option>
                        })}
                    </select>
                    <Button bsSize='small' active={this.state.tagOperatorAnd} onClick={this.onTagOperatorChange}>And</Button>
                </div>
            </div>
        );
    },

    onDateRangeChange: function (start, end) {
        var that = this;
        this.setState({
            startDate: start,
            endDate: end
        }, function () {
            var that = this;
            this.loadLogs(function() {
                that.updateCalendarHeatMap();
            });
        });
    },

    onTagOperatorChange: function () {
        this.setState({
            tagOperatorAnd: !this.state.tagOperatorAnd
        }, function () {
            this.loadLogs(function () {
                this.updateCalendarHeatMap();
            });
        });
    },

    componentDidMount: function () {
        var that = this;
        this.loadTotalTime();
        this.loadProjects(function () {
            var $select = $(that.refs.projectFilter.getDOMNode());
            $select.select2({
                placeholder: "Select a project",
                allowClear: true
            });
            $select.on('change', function (e) {
                 that.onProjectChange(e.val);
            });
        });

        this.loadClasses(function () {
            var $select = $(that.refs.classFilter.getDOMNode());
            $select.select2({
                placeholder: "Select a class",
                allowClear: true
            });
            $select.on('change', function (e) {
                 that.onClassChange(e.val);
            });
        });

        this.loadVersions(function () {
            var $select = $(that.refs.versionFilter.getDOMNode());
            $select.select2({
                placeholder: "Select a version",
                allowClear: true
            });
            $select.on('change', function (e) {
                 that.onVersionChange(e.val);
            });
        });

        this.loadTasks(function () {
            var $select = $(that.refs.taskFilter.getDOMNode());
            $select.select2({
                placeholder: "Select a task",
                allowClear: true
            });
            $select.on('change', function (e) {
                 that.onTaskChange(e.val);
            });
        });

        DataAPI.Tag.load().then(function (tags) {
            that.setState({
                tags: tags
            }, function () {
                var $select = $(that.refs.tagFilter.getDOMNode());
                $select.select2();
                $select.on('change', _.debounce(function (e) {
                     that.onTagFilterChange(e.val);
                }, 200));
            });
        });
    },

    onTagFilterChange: function(tags) {
        if (!_.isEmpty(tags)) {
            this._selectTags = tags;
            this.setFilter({
                tags: tags.join(',')
            });
            this.loadLogs(function () {
                this.updateCalendarHeatMap();
            });
        } else {
            this.deleteFilter('tags');
            this.loadLogs();
        }
    },

    onClassChange: function (cls) {
        if (!cls) {
            this.deleteFilter("classes");
        } else {
            this.setFilter({
                classes: cls
            });
        }
        this.loadLogs(function () {
            this.updateCalendarHeatMap();
        });
    },

    onProjectChange: function (project) {
        if (!project) {
            this.deleteFilter("projects");
        } else {
            this.setFilter({
                projects: project
            });
        }
        this.loadLogs(function () {
            this.updateCalendarHeatMap();
        });
    },

    onVersionChange: function (version) {
        if (!version) {
            this.deleteFilter("versions");
        } else {
            this.setFilter({
                versions: version
            });
        }
        this.loadLogs(function () {
            this.updateCalendarHeatMap();
        });
    },

    onTaskChange: function (task) {
        if (!task) {
            this.deleteFilter("tasks");
        } else {
            this.setFilter({
                tasks: task
            });
        }
        this.loadLogs(function () {
            this.updateCalendarHeatMap();
        });
    },

    updateCalendarHeatMap: function () {
        if (this.refs.calendarHeatMap) {
            this.refs.calendarHeatMap.update();
        }
    },

    loadLogs: function (cb) {
        var that = this;
        var filter = this.getFilter();

        if (_.isEmpty(filter)) {
            this.setState({
                logs: null
            });
        } else {
            this.queryLogs(that.getRequestParams()).then(function (logs) {
                that.setState({
                    logs: logs,
                    logLoaded: true
                }, cb);
            }).catch(function (err) {
                console.error(err.stack);
                Notify.error('load failed');
            });
        }
    },

    loadProjects: function (cb) {
        var that = this;
        DataAPI.Project.load({ aggregate: false, fields: '_id name'})
            .then(function (projects) {
                that.setState({
                    projects: projects
                }, cb);
            });
    },

    loadClasses: function (cb) {
        var that = this;
        DataAPI.Class.load()
            .then(function (classes) {
                that.setState({
                    classes: classes
                }, cb);
            });
    },

    loadVersions: function (cb) {
        var that = this;
        DataAPI.Version.load()
            .then(function (versions) {
                that.setState({
                    versions: versions
                }, cb);
            });
    },

    loadTasks: function (cb) {
        var that = this;
        DataAPI.Task.load({hierarchy: 1, fields: '_id name', calculateTimeConsume: false})
            .then(function (tasks) {
                that.setState({
                    tasks: tasks
                }, cb);
            });
    },

    loadCalendarHeatMapData: function () {
        var params = this.getRequestParams();
        return DataAPI.Log.load(_.extend({
            sum: true,
            group: 'date.day'
        }, params)).then(function (data) {
            return data.map(function (item) {
                return {
                    date: item._id,
                    count: item.totalTime
                }
            });
        });
    },

    getRequestParams: function () {
        return _.extend({
            tagOperator: this.state.tagOperatorAnd ? 'all' : 'or',
            start: this.state.startDate,
            end: this.state.endDate
        }, this.getFilter());
    },

    queryLogs: function (params) {
        return DataAPI.Log.load(params);
    },

    setFilter: function (filter) {
        extend(this._filterParams, filter);
    },

    getFilter: function () {
        return this._filterParams;
    },

    deleteFilter: function (filterName) {
        delete this._filterParams[filterName];
    },

    loadTotalTime: function () {
        var that = this;
        DataAPI.Log.totalTime()
            .then(function (total) {
                that.setState({
                    totalTime: total
                });
            });
    }
});


var LogsTable = React.createClass({

    mixins: [Router.Navigation],

    getInitialState: function () {
        return {
            sortDir: null,
            sortBy: null,
            logs: this.props.logs
        };
    },


    componentWillReceiveProps: function (nextProps) {
        this.setState({
            logs: nextProps.logs,
            sortBy: null,
            sortDir: null
        });
    },

    render: function () {
        var that = this;
        var logs = this.state.logs;
        var clsssesConfig = config.classes;

        function rowGetter(index) {
            return logs[index];
            //return [log.date, log.start, log.end, log.len, log.tags.join(","), log.content];
        }
        function renderDate(cellData, a, row) {
            var dateStr = Moment(cellData).format(DATE_FORMAT);
            return <span className="ltt-link" data-turl={"/logEditor/" + dateStr + '?logOrigin=' + encodeURIComponent(row.origin)}>{dateStr}</span>
        }
        function renderDateTime(cellData) {
            return Moment(cellData).format(TIME_FORMAT);
        }
        function renderTimeLength(cellData) {
            return Util.displayTime(cellData);
        }
        function renderProject(project) {
            if (project) {
                return <span className="ltt-link" data-turl={Util.getProjectUrl(project)}>{project.name}</span>;
            } else {
                return null;
            }
        }
        function renderVersion (version) {
            if (version) {
                return <span className="ltt-link" data-turl={Util.getVersionUrl(version)}>{version.name}</span>;
            } else {
                return null;
            }
        }
        function renderTask(task) {
            if (task) {
                return <span className="ltt-link" data-turl={Util.getTaskUrl(task)}>{task.name}</span>;
            } else {
                return null;
            }
        }
        function renderTags(a,b,data) {
            var tags = data.tags;
            return tags && tags.map(function (tag) {
                return <Tag>{tag}</Tag>;
            });
        }
        function renderClasses(a,b,data) {
            var classes = data.classes;
            if (!classes) {return;}
            var cls = classes[0];
            if (!cls) {return;}
            var clsConfig = clsssesConfig.filter(function (cfg) { return cfg._id === cls; })[0];
            if (!clsConfig) {return cls;}
            return <span style={{color: clsConfig.color}}>{clsConfig.name}</span>
        }

        var sortDir = this.state.sortDir;
        var sortBy = this.state.sortBy;

        function getLabel(label, cellDataKey) {
            var sortDirArrow;
            if (sortDir !== null){
                sortDirArrow = (sortDir === SortTypes.DESC ? ' ↓' : ' ↑');
            }
            label = label + (sortBy === cellDataKey ? sortDirArrow : '');
            return label;
        }
        return <Table
            rowHeight={50}
            rowGetter={rowGetter}
            rowsCount={logs.length}
            width={this.props.width}
            height={this.props.height}
            onRowClick={function (e) {
                var $target = $(e.target);
                var transitionUrl = $target.data('turl');
                if (transitionUrl) {
                    that.transitionTo(transitionUrl);
                }
            }}
            headerHeight={50}>
            <Column label={getLabel("Date", "date")}  width={100} dataKey="date" cellRenderer={renderDate}  headerRenderer={this._renderHeader}/>
            <Column label=""  width={80} dateKey="classes" cellRenderer={renderClasses} headerRenderer={this._renderHeader.bind(this, getLabel("Class", "classes"), "classes")}/>
            <Column label={getLabel("Start", "start")}  width={150} dataKey="start" cellRenderer={renderDateTime} headerRenderer={this._renderHeader}/>
            <Column label={getLabel("End" , "end" )} width={150}  dataKey="end" cellRenderer={renderDateTime} headerRenderer={this._renderHeader}/>
            <Column label={getLabel("Length", "length")}  width={100} dataKey="len" cellRenderer={renderTimeLength} headerRenderer={this._renderHeader}/>
            <Column label={getLabel("Project", "project")}  width={150}  dataKey="project" cellRenderer={renderProject} headerRenderer={this._renderHeader}/>
            <Column label={getLabel("Version", "version")}  width={150}  dataKey="version" cellRenderer={renderVersion} headerRenderer={this._renderHeader}/>
            <Column label={getLabel("Task", "task")}  width={150}  dataKey="task" cellRenderer={renderTask} headerRenderer={this._renderHeader}/>
            <Column label="Content" width={300} headerRenderer={this._renderHeader} dataKey="content" />
        </Table>
    },

    _sortRowsBy: function (cellDataKey) {
        var sortDir = this.state.sortDir;
        var sortBy = cellDataKey;
        if (sortBy === this.state.sortBy) {
            sortDir = this.state.sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
        } else {
            sortDir = SortTypes.DESC;
        }
        var logs = this.state.logs.slice();
        var sortCoefficient = (sortDir === SortTypes.DESC ? -1 : 1);
        var sortFun;
        if (['project', 'version', 'task'].indexOf(cellDataKey) >= 0 ){
            sortFun = function (a, b) {
                var aItem = a[sortBy];
                var bItem = b[sortBy];
                var aVal = (aItem ? aItem.name : "");
                var bVal = (bItem ? bItem.name : "");
                return aVal.localeCompare(bVal) * sortCoefficient;
            };
        } else if (['date', 'start', 'end'].indexOf(cellDataKey) >= 0) {
            sortFun = function (a, b) {
                var aUnix = new Date(a[sortBy]).getTime();
                var bUnix = new Date(b[sortBy]).getTime();
                return (aUnix - bUnix) * sortCoefficient;
            };
        } else if (["content"].indexOf(cellDataKey) >= 0) {
            sortFun = function (a, b) {
                var aVal = (a[sortBy] || "");
                var bVal = (b[sortBy] || "");
                return aVal.localeCompare(bVal) * sortCoefficient;
            };
        } else {
            sortFun = function (a, b) {
                var sortVal = 0;
                var aVal = a[sortBy];
                var bVal = b[sortBy];
                if ( aVal > bVal) {
                    sortVal = 1;
                } else if ( aVal < bVal){
                    sortVal = -1;
                }
                return sortVal * sortCoefficient;
            };
        }
        logs.sort(sortFun);
        this.setState({
            logs: logs,
            sortBy: sortBy,
            sortDir: sortDir
        });
    },

    _renderHeader: function (label, cellDataKey) {
        return (
            <span className="sorter" onClick={this._sortRowsBy.bind(null, cellDataKey)}>{label}</span>
        );
    }
});


module.exports = Logs;
