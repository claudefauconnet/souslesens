/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to w
 * hom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
var   serverRootUrl="";
var Gparams = {

    displayVersion:"1_googleLike",

    searchNodeAutocompletion:true,
    queryInElasticSearch:false,
    ElasticResultMaxSize:1000,



    //init defaults*******************************
    defaultSubGraph:"DB_",
    visibleLinkProperty:null,
    logLevel:5,
    readOnly: true,
    showRelationAttrs:true,
    startWithBulkGraphView: false,
    defaultNodeNameProperty:"name",
    defaultQueryDepth:1,
    defaultGraphtype:"FLOWER",
    graphNavigationMode: "expandNode",
    modifyMode: 'onList',//''onList',
    useVisjsNetworkgraph:true,
    graphAllowPaint:true,
    allowOrphanNodesInGraphQuery:true,

    searchInputKeyDelay:500,
    searchInputMinLength:2,
    showRelationNames:true,
    limitToOptimizeGraphOptions:1000,




//limits************************************
    maxResultSupported:5000,
    graphMaxDataLengthToDisplayGraphDirectly:1000,
    bulkGraphViewMaxNodesToDrawLinks:1000,
    listDisplayLimitMax:1500,
    jsTreeMaxChildNodes:1500,
    maxDepthExplorationAroundNode: 3,
    maxNodesForRelNamesOnGraph:100,
    showLabelsMaxNumOfNodes:4000,//in fact relations



    shortestPathMaxDistanceTest:8,
    graphDefaultLayout:"random",
    graphDefaultShape:"dot",

    //urls************************
    httpProxyUrl: serverRootUrl+"/http",
    neo4jProxyUrl: serverRootUrl+"/neo",
    rdfProxyUrl: serverRootUrl+"/rdf",
    restProxyUrl: serverRootUrl+"/rest",
    mongoProxyUrl: serverRootUrl+"/mongo",
    uploadToNeo: serverRootUrl+"/uploadToNeo",
    storedParamsUrl: serverRootUrl+"/storedParams",
    imagesRootPath: serverRootUrl+"/files/albumPhotos/",





    //divs size*************************
        rightPanelTotalWidthRatio: .3,
    infosanalyzePanelHeight:300,



    //durations************************************
    durationMsecBeforeGraphStop:8000,
    forceAnimationDuration: 2000,




    //others****************************************


    lang: "EN",
    profiles: {
        minimum: {
            hide: ["lang_52", "lang_62", "listDownloadButton", "div_externalRessources", "photoControls"],
            disable: ["listDownloadButton"]
        },
        all: {
            hide: [],
            disable: []
        }
    },
    currentProfile: "all",//minimum ,all
    navigationStyle: "",// , "jpt" // Jean Paul





//Graph display defaults***************************
    circleR: 15,
    defaultNodeColor: "grey",
    nodeMaxTextLength: 40,
    user: "anonymous",
    curveOffset: 40,
    relStrokeWidth: 4,




    outlineColor:"grey",
    outlineEdgeWidth:10,
    outlineTextColor:"red",

    minOpacity: .3,
    d3ForceParams: {distance: 200, charge: -500, gravity: .25},
    htmlOutputWithAttrs: true,

    isInframe: false,
    treeGraphVertSpacing: 35,
    smallDialogSize: {w: 300, h: 400},
    bigDialogSize: {w: 1000, h: 800},
    showBItab:false,
    gantt: {
        name: "nom",
        startField: "datedebut",
        endField: "datefin",
    },

 /*   palette: ['#B39BAB', '#FF78FF', '#A84F02', '#A8A302', '#0056B3',
        '#B354B3', '#FFD900', '#B37A00', '#B3B005', '#007DFF', '#F5ED02',
        '#F67502', '#B35905', '#FFFB08', '#FF7D07', '#FFDEF4',]
,*/
    palette: [
        '#F5ED02',
        '#007DFF',
        '#B354B3',
        '#FF7D07',
        '#005699',
        '#A84F02',
        '#A8A302',
        '#B3B005',
        '#007DFF',
        '#B35905',
        '#FFD900',
        '#FF78FF',
        '#B37A00',


        '#F67502',

        '#FFFB08',

        '#B39BAB',
        '#FFDEF4',]

}


/*
 * palette : [ '#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3', '#B35905',
 * '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502', '#FF78FF', '#FF7D07',
 * '#FFD900', '#FFDEF4', '#FFFB08', ]
 */