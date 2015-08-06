var map, wfs;


var DeleteFeature = OpenLayers.Class(OpenLayers.Control, {
  initialize: function(layer, options) {
      OpenLayers.Control.prototype.initialize.apply(this, [options]);
      this.layer = layer;
      this.handler = new OpenLayers.Handler.Feature(
          this, layer, {click: this.clickFeature}
      );
  },
  clickFeature: function(feature) {
      // if feature doesn't have a fid, destroy it
      if(feature.fid == undefined) {
          this.layer.destroyFeatures([feature]);
      } else {
          feature.state = OpenLayers.State.DELETE;
          this.layer.events.triggerEvent("afterfeaturemodified",
                                         {feature: feature});
          feature.renderIntent = "select";
          this.layer.drawFeature(feature);
      }
  },
  setMap: function(map) {
      this.handler.setMap(map);
      OpenLayers.Control.prototype.setMap.apply(this, arguments);
  },
  CLASS_NAME: "OpenLayers.Control.DeleteFeature"
});


function showMsg(szMessage) {
  document.getElementById("message").innerHTML = szMessage;
  setTimeout(
      "document.getElementById('message').innerHTML = ''",2000);
}


function showSuccessMsg(){
  showMsg("Transaction successfully completed");
};


function showFailureMsg(){
  showMsg("An error occured while operating the transaction");
};


function init() {
  map = new OpenLayers.Map('map', {
      controls: [
          new OpenLayers.Control.PanZoom()
      ]
  });

  var osm = new OpenLayers.Layer.OSM( "Simple OSM Map");


  var saveStrategy = new OpenLayers.Strategy.Save();
  saveStrategy.events.register("success", '', showSuccessMsg);
  saveStrategy.events.register("fail", '', showFailureMsg);
  wfs = new OpenLayers.Layer.Vector("Editable Features", {
      strategies: [new OpenLayers.Strategy.BBOX(), saveStrategy],
      projection: new OpenLayers.Projection("EPSG:3857"),
      protocol: new OpenLayers.Protocol.WFS({
          version: "1.1.0",
          srsName: "EPSG:3857",
          url: "http://192.168.1.119:8080/geoserver/PostGIS_test/wfs",
          //featureNS :  "http://www.tinyows.org/",
          featureType: "railway_station_point",
          geometryName: "wkb_geometry",
          schema: "http://192.168.1.119:8080/geoserver/PostGIS_test/wfs?service=wfs&request=DescribeFeatureType&version=1.1.0&typename=building_polygon"
      })
  });
  map.addLayers([osm, wfs]);
  var panel = new OpenLayers.Control.Panel(
      {'displayClass': 'customEditingToolbar'}
  );
  var navigate = new OpenLayers.Control.Navigation({
      title: "Pan Map"
  });
  var draw = new OpenLayers.Control.DrawFeature(
      wfs, OpenLayers.Handler.Point,
      {
          title: "Draw Feature",
          displayClass: "olControlDrawFeaturePolygon",
          multi: false,
          featureAdded: function(feature) {
              feature.attributes["name"] = "FRECOM WFST"
          }
      }
  );
  var edit = new OpenLayers.Control.ModifyFeature(wfs, {
      title: "Modify Feature",
      displayClass: "olControlModifyFeature"
  });
  var del = new DeleteFeature(wfs, {title: "Delete Feature"});
  var save = new OpenLayers.Control.Button({
      title: "Save Changes",
      trigger: function() {
          if(edit.feature) {
              edit.selectControl.unselectAll();
          }
          saveStrategy.save();
      },
      displayClass: "olControlSaveFeatures"
  });
  panel.addControls([navigate, save, del, edit, draw]);
  panel.defaultControl = navigate;
  map.addControl(panel);
  map.zoomToMaxExtent();
}