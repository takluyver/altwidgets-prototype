(function() {
"use strict";
/*DEFINITIONS_REPLACEMENT*/

var state = {};
for (var i = 0; i < widget_defs.length; i++) {
    var wd = widget_defs[i];
    state[wd.name] = wd.value
}

var comm = IPython.notebook.kernel.comm_manager.new_comm('altwidget',{
    awid: awid,
    data: state
});

var output_area = $('<div>');

comm.on_msg(function(msg) {
    var data = msg.content.data.data;
    output_area.text(data['text/plain']);
});

function update_state(key, val) {
    state[key] = val;
    comm.send({
        kind: 'newstate',
        data: state
    });
}

$('<div>').append(
    $('<div>').slider({
        min: 0,
        max: 10,
        value: 5,
        change: function(event, ui) {
            update_state('a', ui.value);
        }
    }).css({'max-width': '30em', margin: '1em'})
).append(
    $('<div>').slider({
        min: 0,
        max: 10,
        value: 5,
        change: function(event, ui) {
            update_state('b', ui.value);
        }
    }).css({'max-width': '30em', margin: '1em'})
)
.append(output_area)
.appendTo(element);

})();
