import { Component, OnInit } from '@angular/core';

import * as L from 'leaflet';
import * as esri from "esri-leaflet";
import { UserSession } from '@esri/arcgis-rest-auth';
import {  
  solveRoute  
} from "@esri/arcgis-rest-routing";
import { AfterViewInit } from '@angular/core';
import { EventHandler } from './event-handler';
import { geoJSON } from 'leaflet';
import * as geojson from 'geojson';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit{
  title = 'testesri';
  private map;  
  basemapEnum = "ArcGIS:Navigation"; 
  currentStep = "start";
  startLayerGroup; 
  endLayerGroup;
  severalPoints; 
  routeLines;
  startCoords= null;
  endCoords = null; 
  directions;  
  protected onClickHandler: EventHandler;
  route = [];
  TotalPoints = 4; // numero de pontos
  constructor(){
    // Leaflet Map Event Handlers
    this.onClickHandler     = (evt: any) => this.__onMapClick(evt);
  }
  
  
  public ngOnDestroy(): void
  {
    this.map.off('click'    , this.onClickHandler );
    
  }
  ngAfterViewInit(): void {
    this.initMap();
    this.__initMapHandlers();    
  }

  private initMap(): void {

    this.map = L.map('map', {minZoom: 2}).setView([-22.9793, -43.23245], 14);    
    const esriLayer = esri.basemapLayer('Streets');       
    this.map.addLayer(esriLayer);
    
    // Add a DOM Node to display the text routing directions
    this.directions = document.createElement("div");
    this.directions.id = "directions";
    this.directions.innerHTML = "Click on the map to create a start and end for the route.";
    document.body.appendChild(this.directions);
    
    // Layer Group for start/end-points
    this.startLayerGroup = L.layerGroup().addTo(this.map);
    this.endLayerGroup = L.layerGroup().addTo(this.map);    
    // Layer Group for route lines
    this.routeLines = L.layerGroup().addTo(this.map);
    
    //Layer group for several points 
    this.severalPoints = L.layerGroup().addTo(this.map);
  }

  public updateRoute() {

    const authentication = new UserSession({
      token: ""  
    })      
    
    
    solveRoute({
      stops: 
        /* [this.startCoords,                   
          this.endCoords,      
       ] ,*/
       this.route,
       endpoint: 'https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World', 
       authentication              
    }).then(response => {
      // Show the result route on the map.
      this.routeLines.clearLayers();
      L.geoJSON(response.routes.geoJson).addTo(this.routeLines);
      console.log(response);      
      // Show the result text directions on the map.
      const directionsHTML = response.directions[0].features.map((f) => f.attributes.text).join("<br/>");
      this.directions.innerHTML = directionsHTML;
      this.startCoords = null;
      this.endCoords = null;
      
    })
    .catch((error) => {
      console.error(error);
      alert("There was a problem using the route service. See the console for details.");
    });

  }

  /**
   * Execute on Leaflet Map click
   */
   protected __onMapClick(evt: any): void {

    const target: any = evt.originalEvent.target;

    const coordinates = [evt.latlng.lng, evt.latlng.lat];
    this.route.push(coordinates);    

    /* if (this.currentStep === "start") {
      this.startLayerGroup.clearLayers();
      this.endLayerGroup.clearLayers();
      this.routeLines.clearLayers();
      L.marker(evt.latlng).addTo(this.startLayerGroup);
      this.startCoords = coordinates;
      this.currentStep = "end";
    } else {
      L.marker(evt.latlng).addTo(this.endLayerGroup);
      this.endCoords = coordinates;
      this.currentStep = "start";
    }

    if ((this.startCoords !=  this.endCoords) && (this.startCoords &&  this.endCoords) ) {
      this.updateRoute();
    } */

    if(this.route.length<this.TotalPoints){
      L.marker(evt.latlng).addTo(this.severalPoints); 
    }    
    else if(this.route.length == this.TotalPoints){
      L.marker(evt.latlng).addTo(this.severalPoints); 
      this.updateRoute();
    }
    else if(this.route.length > this.TotalPoints){
      this.route.length=0;
      this.severalPoints.clearLayers();      
      this.routeLines.clearLayers();
     }
  }

  
  /**
   * Initialize Leaflet Map handlers
   */
   protected __initMapHandlers(): void
   {     
     this.map.on('click', this.onClickHandler );
   }
}
