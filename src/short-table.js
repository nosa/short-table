/**
 * shortTable
 * ShortTable is the easy way for the create a table.
 *
 * no dependency.
 *
 * id: Object
 * type : String(color || text ||number)
 * value: String
 * align: String(left || center || right)
 * edit: Boolean(true || false)
 */
/*global shortTable: true*/
var shortTable = (function() {
    'use strict';
    var st = {};

    /**
     * shortTable.Table
     */
    st.Table = (function () {
        /**
         * Constructs.
         */
        function Table(options) {
            this.options = options;
            //if (!this.options.stretch) this.options.stretch = 'last';
            // get the table
            var table = document.getElementById(this.options.table);
            table.style.width = this.options.width + 'px';
            var tbody = table.getElementsByTagName('tbody')[0];
            if (!tbody) {
                tbody = document.createElement('tbody');
                table.appendChild(tbody);
            }
            table.classList.add('short-table');
            this.table = table;
            this.tbody = tbody;
            // claer
            this.empty();
        }

        /**
         * Clear the table object. but not clears the dom.
         */
        Table.prototype.clear = function() {
            this._keySet = {};
            if (this._rows) {
                this._rows.forEach(function(row) {
                    row.empty();
                });
            }
            this._rows = [];
        };

        /**
         * Empty. dom is empty, also clears the table objects.
         */
        Table.prototype.empty = function() {
            // clear
            this.clear();
            // empty
            var tbody = this.tbody;
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
        };

        /**
         * Add row to table.
         */
        Table.prototype.addRow = function(id) {
            if (!id) id = this._rows.length;
            var row = new st.Row(id);
            this._rows.push(row);
            this._keySet[id] = row;
            return row;
        };

        /**
         * Get rows.
         * @return {Array.<shortTable.Row>} row collections.
         */
        Table.prototype.getRows = function() {
            return this._rows;
        };

        /**
         * Update a cell value
         * @param  {Object} r row index or id.
         * @param  {Object} c cell index or id.
         * @param  {Object} value
         */
        Table.prototype.updateCell = function(r, c, value) {
            var row;
            if (isNaN(r)) {
                row = this._keySet[r];
            } else {
                row = this._rows[r];
            }
            var cell;
            if (row) cell = row.updateCell(c, value);
        };

        /**
         * Draw a table.
         */
        Table.prototype.flush = function() {
            // dom clear.
            var tbody = this.tbody;
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            // add row
            for (var i = 0; i < this._rows.length; i++) {
                var row = this._rows[i];
                var dom = row.toDom(this.options);
                tbody.appendChild(dom);
            }
        };

        /**
         * Check the table data are valid.
         * @return {Boolean} if true, ok.
         */
        Table.prototype.isValid = function() {
            for (var i = 0; i < this._rows.length; i++) {
                var row = this._rows[i];
                var cells = row.getCells();
                for (var j = 0; j < cells.length; j++) {
                    var cell = cells[j];
                    if (cell.valid === false) return false; 
                }
            }
            return true;
        };

        /**
         * Return cell changed config.
         * @return {Array}
         */
        Table.prototype.getChanges = function() {
            var changes = [];

            for (var i = 0; i < this._rows.length; i++) {
                var row = this._rows[i];
                if (row.changed !== true) continue;
                var change = {id: row.id};
                changes.push(change);
                var cells = row.getCells();
                for (var j = 0; j < cells.length; j++) {
                    var cell = cells[j];
                    if (cell.changed !== true) continue;
                    change[cell.id] = cell.value;
                }
            }

            return changes;
        };

        Table.prototype.getWidth = function() {
            //var hasVertitalScroll = this.table.scrollHeight > this.table.clientHeight;
            //var offset = hasVertitalScroll ? 10 : 0;
            // return this.tbody.getClientRects()[0].width + offset;
            return this.options.width;
        };

        return Table;
    })();

    /**
     * shortTable.Row
     */
    st.Row = (function () {
        /**
         * Constructs
         */
        function Row(id) {
            this.id = id;
            this.changed = false;
            this.empty();
        }

        /**
         * Clear
         */
        Row.prototype.empty = function() {
            if (this._cells) {
                this._cells.forEach(function(cell) {
                    cell.empty();
                });
            }
            this._cells = [];
            this._keySet = {};
        };

        /**
         * Add a cell.
         * @param {Object} config            [description]
         * @param {Function} clickCallback [description]
         */
        Row.prototype.addCell = function(config, clickCallback) {
            if (!config.id) config.id = this._cells.length;
            var cell = new st.Cell(config, clickCallback);
            cell.row = this;
            this._cells.push(cell);
            this._keySet[config.id] = cell;
            return this;
        };

        /**
         * Return a cell collection.
         * @return {Array<Cell>}
         */
        Row.prototype.getCells = function() {
            return this._cells;
        };

        /**
         * Update a cell value
         * @param  {Object} c index or id.
         * @param  {Object} value
         * @return {Cell} cell
         */
        Row.prototype.updateCell = function(c, value) {
            var cell;
            if (isNaN(c)) {
                cell = this._keySet[c];
            } else {
                cell = this._cells[c];
            }
            cell.updateValue(value);
            return cell;
        };

        /**
         * Return a tr element.
         * @return {Element} tr
         */
        Row.prototype.toDom = function(tableOptions) {
            var tr = document.createElement('tr');
            var cells = this._cells;
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                var td = cell.toDom();
                // defined a cell id. (need rowId)
                td.id = getId(this.id, cell.id);
                tr.appendChild(td);
            }
            // stretch
            if (tableOptions && tableOptions.stretch) {
                var stretch = tableOptions.stretch;
                if (stretch === 'last') {
                    var lastTd = cells[cells.length - 1].td;
                    lastTd.style.width = tableOptions.width + 'px';
                }
            }

            return tr;
        };

        return Row;
    })();

    /**
     * shortTable.Cell
     */
    st.Cell = (function () {
        /**
         * Constructs
         * @param {Object} config          [description]
         * @param {Function} clickCallback [description]
         */
        function Cell(config, clickCallback) {
            this.id = config.id;
            this.config = config;
            this.value = config.value;
            this.changed = false;
            this.onclick = clickCallback;
        }

        /**
         * Update a cell value
         * @param  {Object} value
         */
        Cell.prototype.updateValue = function(value) {
            this.value = value;
            this.target[this.targetAttributeName] = value;
        };

        /**
         * Return a td element.
         * @return {Element} td
         */
        Cell.prototype.toDom = function() {
            var td = document.createElement('td');
            var type = this.config.type;
            // create the element.
            var element;
            if (!type || type === 'text' || type === 'number') {
                element = getTextElement(this);
            } else if (type === 'color') {
                element = getColorElement(this);
            } else {
                element = getTextElement(this);
            }
            // class
            if (this.config.class) {
                element.classList.add(this.config.class);
            }
            td.style.textAlign = this.config.align;
            td.appendChild(element);
            // cell click event
            if (this.onclick) {
                td.addEventListener('click', this.onclick.bind(this), false);
            }
            this.td = td;
            this.target = element;
            return td;
        };

        /**
         * Empty. remove dom event, and references.
         */
        Cell.prototype.empty = function() {
            // remove cell click event
            if (this.onclick) {
                this.td.removeEventListener('click', this.onclick, false);
            }
            // remove cell changed event.
            if (this.config.edit === true) {
                this.target.removeEventListener('change', onCellChange, false);
            }
            // remove dom reference.
            var cell = this;
            Object.getOwnPropertyNames(this).forEach(function(prop) {
                delete cell[prop];
            });
        };

        /**
         * Return a text element.
         * @param  {Cell} cell
         * @return {Element}
         */
        function getTextElement(cell) {
            var editable = cell.config.edit;
            var value = cell.value;
            var input;
            if (editable) {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                cell.targetAttributeName = 'value';
                // input change
                input.addEventListener('change', onCellChange.bind(cell), false);
                input.style.textAlign = cell.config.align;
            } else {
                input = document.createElement('span');
                input.textContent = value;
                cell.targetAttributeName = 'textContent';
            }
            return input;
        }

        /**
         * Event of the after cell edited.
         */
        function onCellChange() {
            var cell = this;
            var value = cell.target[cell.targetAttributeName];
            var type= cell.config.type;
            if (type === 'number') {
                if (isNaN(value)) {
                    cell.valid = false;
                } else {
                    cell.valid = true;
                }
            }
            cell.value = value;
            cell.changed = true;
            cell.row.changed = true;
            cell.target.classList.remove('invalid');
            if (cell.valid === false) {
                cell.target.classList.add('invalid');
            }
        }

         /**
         * Return a color element.
         * @param  {Cell} cell
         * @return {Element}
         */
        function getColorElement(cell) {
            var color = cell.config.color;
            if (!color) {
                if (window.randomColor) {
                    color = randomColor({luminosity: 'light',count: 1})[0];
                }
            }
            var bg = 'linear-gradient(to right, ' + color +' 15px, rgba(255, 255, 255, 0) 0)';
            var a = document.createElement('a');
            a.textContent = cell.value;
            cell.targetAttributeName = 'textContent';
            a.style.background = bg;
            a.classList.add('color');
            return a;
        }

        return Cell;
    })();

    function getId(r, c) {
        return 'st-' + r + '-' + c;
    }

    return st;
}());
