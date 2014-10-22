$(function() {
{% if current_encounter %}
window.encounter_id = {{ current_encounter.id }};
$('#encounter_input').show();
$('#encounter_buttons').html('<input type="button" id="stop_encounter" value="Stop encounter" /><input type="button" id="view_encounter" value="View encounter" />');
{% else %}
$('#encounter_input').hide();
$('#encounter_buttons').html('<input type="button" id="start_encounter" value="Start encounter" />');
{% endif %}
var problems;
var isDown = false;     //flag we use to keep track
var x1, y1, x2, y2;     //to store the coords
var painAvatars = [
{% for pa in pain_avatars %}{'datetime': "{{ pa.datetime }}", 'json': {{ pa.json|safe }}}
{% if not forloop.last %},{% endif %}
{% endfor %}
];
var bodyParts = [{'name': 'head part', 'center': [100,35], 'radius':30, 'snomed_id': '123850002', 'status': 'gray', 'shape_type': 'circle'},
               
                 // SPINE
                 
                 {'name': 'neck structure', 'coordinates': [[90,70],[110,70],[110,90],[90,90]], 'snomed_id': '45048000', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'structureThoracic spine ', 'coordinates': [[90,95],[110,95],[110,160],[90,160]], 'snomed_id': '122495006', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Lumbar spine structure', 'coordinates': [[90,165],[110,165],[110,220],[90,220]], 'snomed_id': '122496007', 'status': 'gray', 'shape_type': 'polygon'},
                 
                // RIGHT UPPER LIMB
                 
                 {'name': 'R thorax structure ', 'coordinates': [[40,95],[85,95],[85,135]], 'snomed_id': '51872008', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of right shoulder region', 'center': [30,110], 'radius':10, 'snomed_id': '91774008', 'status': 'gray', 'shape_type': 'circle'},                
                 {'name': 'Right upper arm structure', 'coordinates': [[20,125],[40,125],[40,178],[20,178]], 'snomed_id': '368209003', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Right elbow region structure', 'center': [30,190], 'radius':8, 'snomed_id': '368149001', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of right forearm', 'coordinates': [[20,200],[40,200],[40,240],[20,240]], 'snomed_id': '64262003', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of right wrist ', 'center': [30,252], 'radius':8, 'snomed_id': '368149001', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of right hand', 'coordinates': [[20,265],[40,265],[40,275],[20,275]], 'snomed_id': '78791008', 'status': 'gray', 'shape_type': 'polygon'},
                 
                 // R LOWER EXTREMITY
                 
                  {'name': 'Right hip region structure', 'center': [65,233], 'radius':12, 'snomed_id': '287579007', 'status': 'gray', 'shape_type': 'circle'},                
                 {'name': 'Structure of right thigh', 'coordinates': [[55,250],[75,250],[75,315],[55,315]], 'snomed_id': '11207009', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of right knee', 'center': [65,330], 'radius':10, 'snomed_id': '6757004', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of right lower leg', 'coordinates': [[55,345],[75,345],[75,395],[55,395]], 'snomed_id': '32696007', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of right ankle', 'center': [65,410], 'radius':10, 'snomed_id': '6685009', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of right foot', 'coordinates': [[55,425],[75,425],[75,440],[55,440]], 'snomed_id': '7769000', 'status': 'gray', 'shape_type': 'polygon'},
                 
                 // LEFT UPPER LIMB
                 
                 {'name': 'L thorax structure ', 'coordinates': [[160,95],[115,95],[115,135]], 'snomed_id': '40768004', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of left shoulder region', 'center': [170,110], 'radius':10, 'snomed_id': '91775009', 'status': 'gray', 'shape_type': 'circle'},  
                 {'name': 'Left upper arm structure', 'coordinates': [[160,125],[180,125],[180,178],[160,178]], 'snomed_id': '368209003', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Left elbow region structure', 'center': [170,190], 'radius':8, 'snomed_id': '368149001', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of left forearm', 'coordinates': [[160,200],[180,200],[180,240],[160,240]], 'snomed_id': '66480008', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of left wrist ', 'center': [170,252], 'radius':8, 'snomed_id': '5951000', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of left hand', 'coordinates': [[160,265],[180,265],[180,275],[160,275]], 'snomed_id': '85151006', 'status': 'gray', 'shape_type': 'polygon'},
                 
                 // LEFT LOWER LIMB
                 
                 {'name': 'Left hip region structure', 'center': [135,233], 'radius':12, 'snomed_id': '287679003', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of left thigh', 'coordinates': [[125,250],[145,250],[145,315],[125,315]], 'snomed_id': '61396006', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of left knee', 'center': [135,330], 'radius':10, 'snomed_id': '82169009', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of left lower leg', 'coordinates': [[125,345],[145,345],[145,395],[125,395]], 'snomed_id': '48979004', 'status': 'gray', 'shape_type': 'polygon'},
                 {'name': 'Structure of left ankle', 'center': [135,410], 'radius':10, 'snomed_id': '51636004', 'status': 'gray', 'shape_type': 'circle'}, 
                 {'name': 'Structure of left foot', 'coordinates': [[125,425],[145,425],[145,440],[125,440]], 'snomed_id': '22335008', 'status': 'gray', 'shape_type': 'polygon'},
                 
                ];
//var cycle = {'gray': 'red', 'red': 'green', 'green': 'gray'};
var cycle = {'gray': 'red', 'red': 'gray'};
function pnpoly( nvert, vertx, verty, testx, testy ) {
    var i, j, c = false;
    for( i = 0, j = nvert-1; i < nvert; j = i++ ) {
        if( ( ( verty[i] > testy ) != ( verty[j] > testy ) ) &&
            ( testx < ( vertx[j] - vertx[i] ) * ( testy - verty[i] ) / ( verty[j] - verty[i] ) + vertx[i] ) ) {
                c = !c;
        }
    }
    return c;
}
function intersects(x, y, cx, cy, r) {
    var dx = x-cx
    var dy = y-cy
    return dx*dx+dy*dy <= r*r
}
function getObject(x,y) {
    for (var i=0; i<bodyParts.length; i++) {
        var c = bodyParts[i];
        if (c['shape_type'] == 'polygon') {
            var c = bodyParts[i]['coordinates']
            var vertx = [];
            var verty = [];
            for (var j=0;j<c.length;j++) {
                vertx.push(c[j][0]);
                
            }
            for (var j=0;j<c.length;j++) {
                verty.push(c[j][1]);
                
            }
            
            if (pnpoly(c.length, vertx, verty, x, y) == true) {
                bodyParts[i]['status'] = cycle[bodyParts[i]['status']];
                var ctx = document.getElementById("myCanvas").getContext("2d");
                var c = bodyParts[i];
                ctx.fillStyle = c['status'];
                ctx.beginPath();
                ctx.moveTo(c['coordinates'][0][0], c['coordinates'][0][1]);
                for (var j=1; j<c['coordinates'].length; j++) {
                    ctx.lineTo(c['coordinates'][j][0], c['coordinates'][j][1]);
                }
                ctx.closePath();
                ctx.fill();
            }
        } else {
            if (intersects(x,y,c['center'][0],c['center'][1], c['radius']) == true) {
                bodyParts[i]['status'] = cycle[bodyParts[i]['status']];
                var ctx = document.getElementById("myCanvas").getContext("2d");
                ctx.fillStyle = c['status'];
                ctx.beginPath();
                ctx.arc(c['center'][0], c['center'][1], c['radius'], 0, 2 * Math.PI, false);
                
                ctx.closePath();
                ctx.fill();
            }             
        }
    }      
}
// get mouse pos relative to canvas (yours is fine, this is just different)
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
    
 

   function startSlideshow() {
window.t=0;
$('.pain_avatar').hide();
$('#pain_avatar'+t).show();
$('#pain_avatar'+t+' p').append(' ('+(t+1)+'/'+painAvatars.length+')');
window.slideshow = setInterval(function() { if (t+1 < painAvatars.length) { $('.pain_avatar').hide();t+=1;$('#pain_avatar'+t).show();} else {$('#pain_avatar'+t).append(' End of slideshow');$('#toggleSlideshow').val('Start slideshow');clearInterval(window.slideshow)} }, 2000);
}

function stopSlideshow() {
clearInterval(window.slideshow);
var t=0;
$('.pain_avatar').hide();
$('#pain_avatar'+t).show();
}

function forwards() {
if (t+1 == painAvatars.length) {
t = -1;
}
$('.pain_avatar').hide();window.t+=1;$('#pain_avatar'+window.t).show();
}

function backwards() {
if (t-1 == -1) {
t = painAvatars.length;
}
$('.pain_avatar').hide();window.t-=1;$('#pain_avatar'+window.t).show();
}
    


    for (var i=painAvatars.length-1;i>-1;i--) {
        if (i+1 < painAvatars.length) {
            for (var key in painAvatars[i]['json']) {
                if (painAvatars[i]['json'][key] == 'gray' && (painAvatars[i+1]['json'][key] == 'red' || painAvatars[i+1]['json'][key] == 'green')) {
                    painAvatars[i]['json'][key] = 'green';
                }
            }
        }
    }

    for (var i=0;i<painAvatars.length;i++) {
        $('#avatars').append('<div class="pain_avatar" id="pain_avatar'+i+'"><canvas id="myCanvas'+i+'" width="214" height="442" style="border:1px solid #000000;"></canvas><p>'+painAvatars[i]['datetime']+' ('+(i+1)+'/'+painAvatars.length+')</p></div>');
        for (var j=0; j<bodyParts.length; j++) {
            
            var c = bodyParts[j];
            var ctx = document.getElementById("myCanvas"+i).getContext("2d");
            ctx.fillStyle = painAvatars[i]['json'][bodyParts[j]['snomed_id']];
            ctx.beginPath();
            if (c['shape_type'] == 'polygon') {
                
                ctx.moveTo(c['coordinates'][0][0], c['coordinates'][0][1]);
                for (var k=1; k<c['coordinates'].length; k++) {
                    ctx.lineTo(c['coordinates'][k][0], c['coordinates'][k][1]);
                }
            } else {
                ctx.arc(c['center'][0], c['center'][1], c['radius'], 0, 2 * Math.PI, false);
            }
            ctx.closePath();
            ctx.fill();
        }
    }
window.t=0;
$('.pain_avatar').hide();
$('#pain_avatar'+t).show();
$('#toggleSlideshow').click(function(e) {
    //alert($(this).val());
    if ($(this).val() == 'Start slideshow') {
        startSlideshow();
        $(this).val('Stop slideshow');
    } else {
        stopSlideshow();
        $(this).val('Start slideshow');
    }
});
$('#forwards').click(function(e) {
forwards();
});
$('#backwards').click(function(e) {
backwards();
});
$('#reset').click(function() {
    $.post('/pain/reset/', {}, function () {
        window.location = '/pain/create_pain_avatar/';
    });
});
});