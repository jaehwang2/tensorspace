import { NativeLayer } from "../abstract/NativeLayer";
import { OutputMap3d } from "../../elements/OutputMap3d";
import { ColorUtils } from "../../utils/ColorUtils";
import { QueueAggregation } from "../../elements/QueueAggregation";
import { CloseButtonRatio } from "../../utils/Constant";
import { YoloResultGenerator } from "../../utils/YoloResultGenerator";

function YoloBox(config) {

	NativeLayer.call(this, config);

	this.width = undefined;
	this.height = undefined;
	this.depth = 3;

	this.outputHandler = undefined;

	this.rectangleList = [];
	this.channelIndex = undefined;
	this.allChannel = true;

	this.anchors = undefined;
	this.isOpen = false;

	this.layerType = "yoloBox";

}

YoloBox.prototype = Object.assign( Object.create( NativeLayer.prototype ), {

	loadLayerConfig: function( layerConfig ) {

		console.log( layerConfig );

		if ( layerConfig.anchors !== undefined ) {

			this.anchors = layerConfig.anchors;

		} else {

			console.error( "\"anchors\" property is required." );

		}

	},

	init: function( center, actualDepth ) {

		this.center = center;
		this.actualDepth = actualDepth;

		this.neuralGroup = new THREE.Group();
		this.neuralGroup.position.set( this.center.x, this.center.y, this.center.z );

		this.initAggregationElement();

		this.scene.add( this.neuralGroup );

		// Create relative line element.

		this.addLineGroup();

	},

	assemble: function(layerIndex) {

		this.layerIndex = layerIndex;

		let modelInputShape = this.model.layers[ 0 ].outputShape;

		this.width = modelInputShape[ 0 ];
		this.height = modelInputShape[ 1 ];

		this.inputShape = this.lastLayer.outputShape;

		this.channelShape = this.inputShape;
		this.outputShape = [ this.width, this.height ];

		this.unitLength = this.lastLayer.unitLength;
		this.actualWidth = this.lastLayer.actualWidth;
		this.actualHeight = this.lastLayer.actualHeight;

	},

	initAggregationElement: function() {

		let aggregationHandler = new QueueAggregation(

			this.actualWidth,
			this.actualHeight,
			this.actualDepth,
			this.color

		);

		aggregationHandler.setLayerIndex( this.layerIndex );
		aggregationHandler.setPositionedLayer( this.layerType );

		this.aggregationHandler = aggregationHandler;
		this.neuralGroup.add( this.aggregationHandler.getElement() );

	},

	disposeAggregationElement: function() {

		this.neuralGroup.remove( this.aggregationHandler.getElement() );
		this.aggregationHandler = undefined;

	},

	initOutput: function() {

		let outputHandler = new OutputMap3d(

			this.width,
			this.height,
			this.unitLength,
			this.actualDepth,
			{

				x: 0,
				y: 0,
				z: 0

			},
			this.color,
			this.minOpacity

		);

		outputHandler.setLayerIndex( this.layerIndex );
		outputHandler.setPositionedLayer( this.layerType );

		this.outputHandler = outputHandler;
		this.neuralGroup.add( this.outputHandler.getElement() );

		if ( this.neuralValue !== undefined ) {

			this.updateOutputVis();

		}

	},

	disposeOutput: function() {

		this.neuralGroup.remove( this.outputHandler.getElement() );
		this.outputHandler = undefined;

	},

	loadModelConfig: function( modelConfig ) {

		this.loadBasicModelConfig( modelConfig );

	},

	updateValue: function() {

		this.neuralValue = this.model.inputValue;

		this.updateOutputVis();

	},

	updateOutputVis: function() {

		if ( this.isOpen ) {

			let colors = ColorUtils.getAdjustValues( this.neuralValue, this.minOpacity );
			this.outputHandler.updateVis( colors, this.rectangleList );

		}

	},

	addRectangleList: function( channelData, widthIndex, heightIndex ) {

		this.allChannel = false;

		this.rectangleList = YoloResultGenerator.getChannelBox(

			channelData,
			this.channelShape,
			this.outputShape,
			this.anchors,
			widthIndex,
			heightIndex

		);

		if ( this.isOpen ) {

			this.updateOutputVis();

		}

	},

	handleClick: function(clickedElement) {

		if ( clickedElement.elementType === "aggregationElement" ) {

			this.openLayer();

		} else if ( clickedElement.elementType === "closeButton" ) {

			this.closeLayer();

		}

	},

	handleHoverIn: function( hoveredElement ) {

		if ( this.relationSystem ) {

			this.lineGroupHandler.initLineGroup( hoveredElement );

		}

		if ( this.textSystem ) {

			this.showText( hoveredElement );

		}

	},

	handleHoverOut: function() {

		if ( this.relationSystem ) {

			this.lineGroupHandler.disposeLineGroup();

		}

		if ( this.textSystem ) {

			this.hideText();

		}

	},

	showText: function(element) {

		if ( element.elementType === "outputMap3d" ) {

			this.outputHandler.showText();
			this.textElementHandler = this.outputHandler;

		}

	},

	hideText: function() {

		if ( this.textElementHandler !== undefined ) {

			this.textElementHandler.hideText();
			this.textElementHandler = undefined;

		}

	},

	getRelativeElements: function( selectedElement ) {

		let relativeElements = [];

		if ( selectedElement.elementType === "aggregationElement" || ( this.allChannel && selectedElement.elementType === "outputMap3d" ) ) {

			let request = {

				all: true

			};

			relativeElements = this.lastLayer.provideRelativeElements( request ).elementList;

		} else if ( selectedElement.elementType === "outputMap3d" ) {

			let request = {

				index: this.channelIndex

			};

			relativeElements = this.lastLayer.provideRelativeElements( request ).elementList;

		}

		return relativeElements;

	},

	clear: function() {

		this.neuralValue = undefined;

		if (this.outputHandler !== undefined) {

			this.outputHandler.clear();

		}

	},

	calcCloseButtonSize: function() {

		return this.unitLength * this.width * CloseButtonRatio;

	},

	calcCloseButtonPos: function() {

		return {

			x: - this.unitLength * this.width / 2 - 20 * this.unitLength,
			y: 0,
			z: 0

		};

	},

	openLayer: function() {

		if ( !this.isOpen ) {

			this.isOpen = true;

			this.disposeAggregationElement();
			this.initOutput();
			this.updateOutputVis();
			this.initCloseButton();

		}

	},

	closeLayer: function() {

		if ( this.isOpen ) {

			this.isOpen = false;

			this.disposeOutput();
			this.disposeCloseButton();
			this.initAggregationElement();

		}

	}

} );

export { YoloBox };