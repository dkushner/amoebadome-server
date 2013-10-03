var Light = Class.create(Component { //Inheritied from base class Component
	initialize: function($super,lightType){
		this._owner = {}; //which entity will own this component
		this._opts = Array.prototype.slice.call(arguments,2);
		var numArgs = arguments.length;
		
		// give this component all the properties of the three.js lighttype of their choice
		if(lightType == "light" || lightType == "Light")
		{
			_.defaults(this, Object3D.Light.prototype);
			if(numArgs == 3)
				this.Light.call(this, this._opts[0]); //set the hex value passed in for the light
			else
				argError(lightType); //call argument error function
		}
		else if(lightType == "ambient" || lightType == "Ambient")
		{
			_.defaults(this, Object3D.AmbientLight.prototype);
			if(numArgs == 3)
				this.AmbientLight.call(this, this._opts[0]);
			else
				argError(lightType);
		}
		else if(lightType == "area" || lightType == "Area")
		{
			_.defaults(this, Object3D.AreaLight.prototype);
			if(numArgs == 4)
			{
				this.AreaLight.call(this, this._opts[0]);
				this.AreaLight.call(this, this._opts[1]);
			}
			else
				argError(lightType);	
		}
		else if(lightType == "directional" || "Directional")
		{
			_.defaults(this, Object3D.DirectionalLight.prototype);
			if(numArgs == 4)
			{
				this.DirectionalLight.call(this,this._opts[0]);
				this.DirectionalLight.call(this,this._opts[1]);
			}
			else
				argError(lightType);
		}
		else if(lightType == "hemisphere" || lightType == "Hemisphere")
		{
			_.defaults(this, Object3D.HemisphereLight.prototype);
			if(numArgs == 5)
			{
				this.HemisphereLight.call(this, this._opts[0]);
				this.HemisphereLight.call(this, this._opts[1]);
				this.HemisphereLight.call(this, this._opts[2]);
			}
			else
				argError(lightType);
		}
		else if(lightType == "point" || lightType == "Point")
		{
			_.defaults(this, Object3D.PointLight.prototype);
			if(numArgs == 5)
			{
				this.PointLight.call(this, this._opts[0]);
				this.PointLight.call(this, this._opts[1]);
				this.PointLight.call(this, this._opts[2]);
			}
			else
				argError(lightType);
		}
		else if(lightType == "spot" || lightType == "Spot")
		{
			_.defaults(this, Object3D.SpotLight.prototype);
			if(numArgs == 7)
			{
				this.SpotLight.call(this, this._opts[0]);
				this.SpotLight.call(this, this._opts[1]);
				this.SpotLight.call(this, this._opts[2]);
				this.SpotLight.call(this, this._opts[3]);
				this.SpotLight.call(this, this._opts[4]);
			}
			else
				argError(lightType);
		}
		else
			Console.error("Can not create a light of type: " + lightType);
		
		$super("light"); //call the base class initialize to set the type
		//$super(lightType);
	}
	
	argError: function(lightType){
		Console.error("Incorrect number of arguments for " + lightType + " constructor");
	}
})
