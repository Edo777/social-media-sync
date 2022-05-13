const fs = require("fs");
const path = require("path");

class ErrorWriter {
  constructor() {
    this.errorPath = path.join(__dirname, '..', 'errors', 'errors.txt');
  }

  write(data) {
      if(typeof data !== "string") {
        try {
          data = data.toString()
        } catch (error) {
          data = null; 
        }
      }

      if(data) {
        let prevData = '';

        try {
          prevData = fs.readFileSync(this.errorPath)
        } catch (error) {}
        
        data = `${prevData} \n ------------------------${new Date()}-------------------------- \n ${data} \n`;
        data += `------------------------ ${new Date()} ------------------------- \n`;
        fs.writeFile(this.errorPath, data, (err) => {console.log(err)});
      }
  }
}

module.exports = new ErrorWriter();