import { MinAlpha } from "../utils/Constant";

function PaddingMap(width, height, center, paddingWidth, paddingHeight) {

	this.width = width;
	this.height = height;
	this.center = center;

	this.paddingWidth = paddingWidth;
	this.paddingHeight = paddingHeight;

	this.paddingTop = Math.floor(paddingHeight / 2);
	this.paddingBottom = this.paddingHeight - this.paddingTop;
	this.paddingLeft = Math.floor(paddingWidth / 2);
	this.paddingRight = this.paddingWidth - this.paddingLeft;

	this.contentWidth = this.width - this.paddingWidth;
	this.contentHeight = this.height - this.paddingHeight;

	this.featureMap = undefined;

	this.initFeatureMap();

}

PaddingMap.prototype = Object.assign(Object.create(PaddingMap.prototype), {

	initFeatureMap: function() {

		let geometry = new THREE.BoxGeometry(this.fmWidth, 1, this.fmHeight, this.fmWidth, 1, this.fmHeight);
		let material = new THREE.MeshBasicMaterial({
			vertexColors: THREE.FaceColors
		});

		let cube = new THREE.Mesh(geometry, material);

		cube.position.set(this.fmCenter.x, this.fmCenter.y, this.fmCenter.z);

		this.featureMap = cube;

	},

	getMapElement: function() {
		return this.featureMap;
	},

	updateGrayScale: function(greyPixelArray) {

		let frontStartIndex = 2 * 2 * this.height;
		let backStartIndex = 2 * 2 * this.height + 2 * this.width * this.height;

		for (let i = 0; i < this.width; i++) {

			for (let j = 0; j < this.height; j++) {

				let rgb = [];

				if (!this.isPadding(j, i)) {

					let correspondingIndex = this.contentWidth * ( i - this.paddingTop) + ( j - this.paddingLeft );
					rgb = greyPixelArray[correspondingIndex];

				} else {
					rgb.push(MinAlpha);
					rgb.push(MinAlpha);
					rgb.push(MinAlpha);
				}

				this.featureMap.geometry.faces[ frontStartIndex + this.width * i + j ].color.setRGB( rgb[0], rgb[1], rgb[2] );
				this.featureMap.geometry.faces[ frontStartIndex + this.width * i + j + 1 ].color.setRGB( rgb[0], rgb[1], rgb[2] );
				this.featureMap.geometry.faces[ backStartIndex + this.width * i + j ].color.setRGB( rgb[0], rgb[1], rgb[2] );
				this.featureMap.geometry.faces[ backStartIndex + this.width * i + j + 1 ].color.setRGB( rgb[0], rgb[1], rgb[2] );

			}

		}

		this.featureMap.geometry.colorsNeedUpdate = true;

	},

	isPadding: function(x, y) {

		if (y >= this.paddingTop &&
			y < (this.height - this.paddingBottom) &&
			x >= this.paddingLeft &&
			x < (this.width - this.paddingRight)) {
			return false;
		}

		return true;

	}

});

export default PaddingMap;