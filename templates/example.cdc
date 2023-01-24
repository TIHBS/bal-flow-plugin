pub contract Example {

    // Declare a stored state field in HelloWorld
    //
    pub let greeting: String

    // Declare a function that can be called by anyone
    // who imports the contract
    //
    pub fun hello(): String {
        return self.greeting
    }

    pub fun setValues(name: String) : void {
        self.greeting = name;
    }

    init() {
        self.greeting = "Hello World!"
    }

}