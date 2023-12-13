module.exports = function(app, webData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
          res.redirect('./login')
        } else { next (); }
    }

    const ApifyClient = require('apify-client');

    const saltRounds = 10;
    const bcrypt = require('bcrypt');

    const request = require('request');





    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', webData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', webData);
    });
    app.get('/search', redirectLogin, function(req,res){
        res.render("search.ejs", webData);
    });


    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, webData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });


    app.get('/register', function (req,res) {
        res.render('register.ejs', webData);                                                                     
    });                           

    app.post('/registered', function (req,res) {

         // Sanitize inputs
         req.body.first = req.sanitize(req.body.first);
         req.body.last = req.sanitize(req.body.last);
         req.body.username = req.sanitize(req.body.username)
         req.body.password = req.sanitize(req.body.password)
         req.body.email = req.sanitize(req.body.email)
 
        const plainPassword = req.body.password;


        // Hash the password as follows before storing it in the database :
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {

            if (err) {
                return console.error(err.message);
            }

            // saving data in database
            // Store hashed password in your database.
            let sqlquery = "INSERT INTO userdetails (username, first, last, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newuser = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];



            // execute sql query
            db.query(sqlquery, newuser, (err, result) => {
            if (err) {
               return console.error(err.message);
            } else {
                // saving data in database

                result = 'Hello '+ req.body.first + ' '+ req.body.last +' you are now registered!  We will send an email to you at ' + req.body.email;
                result += 'Your password is: '+ req.body.password +' and your hashed password is: '+ hashedPassword;
                
                res.send(result);            
            }
        })
      })
    }); 







       
    
    
    app.get('/login',function(req,res){
        res.render('login.ejs', webData);
    });




    app.post('/loggedin', function (req,res) {

         // Search for hashed password in your database.
         let sqlquery = "SELECT hashedPassword FROM userdetails WHERE username = ?";
         let user = [req.body.username];


          // execute sql query
          db.query(sqlquery, user, (err, result) => {

            if (err) {
               return console.error(err.message);

            } else if(result.length > 0) {

                //username found in database
                let hashedPassword = result[0].hashedPassword;

                 
        // Compare the password supplied with the password in the database
        bcrypt.compare(req.body.password, hashedPassword, function(err, result) {


            if (err) {
            // error message
            return console.log(err.message);
            }
            else if (result == true) {

                // Save user session here, when login is successful
                req.session.userId = req.body.username;

                // login successful
                let message = 'Hello '+ ' ' + req.body.username + ' you are logged in'                
                res.send(message);   
            }
            else {
                // login unsuccessful
                let message = 'Login unsuccessful, please try again'
                res.send(message);
         }
       })

            } else {

                //No user found in database
                let message  = "username incorrect or not found";
                res.send(message);

            }
  })
}); 

           //page to display form for deleting user

            app.get('/deleteuser', redirectLogin, function (req,res) {
                res.render('deleteuser.ejs', webData);                                                                     
            });                           


           //delete a user from the database

            app.post('/deleteduser', redirectLogin, function (req,res) {

                // Search for username match in database
                let sqlquery = "DELETE FROM userdetails WHERE username = ?";
                let user = [req.body.username];


                // execute sql query
                db.query(sqlquery, user, (err, result) => {

                if (err) {
                    return console.error(err.message);

                } else if(result.affectedRows > 0) {

                    //this means user was deleted

                    let sqlquery = "SELECT * FROM userdetails"; // query database to get all users
                    // execute sql query
                    db.query(sqlquery, (err, result) => {
                        if (err) {
                            res.redirect('./'); 
                        }
                        let newData = Object.assign({}, webData, {availableUsers:result});
                        console.log(newData)
                        res.render("listusers.ejs", newData)
                     });

                } else {

                     //No user found in database
                     let message  = "username incorrect or not found";
                     res.send(message);
                   
                }
            })
            }); 
        

            app.get('/logout', redirectLogin, (req,res) => {
                req.session.destroy(err => {
                if (err) {
                  return res.redirect('./')
                }
                res.send('you are now logged out. <a href='+'./'+'>Home</a>');
                })
            })




         app.get('/ratings',function(req,res){
        res.render('ratings.ejs', webData)
    });



            app.get('/scrapert', function(req, res) {
            
                // Prepare the input for the Apify Actor
                var input = {
                    "startUrls": [
                        {
                            "url": "https://www.rottentomatoes.com/tv/the_office"
                        }
                    ],
                    "proxyConfig": {
                        "useApifyProxy": true
                    }
                };
            
                var actorApiUrl = 'https://api.apify.com/v2/acts/rado.ch~rotten-tomatoes-scraper/runs?token=apify_api_ehQMpaOXevsi0gm1AFaLAnTlAKaf6734a8Li'; // Replace YOUR_API_TOKEN with your actual Apify token
            
                // Send a POST request to the Apify API to start the actor
                request.post({
                    url: actorApiUrl,
                    json: input
                }, function(err, response, body) {
                    if (err) {
                        console.error('Error starting Apify actor:', err);
                        res.status(500).send('Error starting the scraping process.');
                        return;
                    }
            
                    // var runId = body.data.id; // Get the ID of the actor run
                    // console.log(runId)

                    // var getDatasetUrl = `https://api.apify.com/v2/datasets/${runId}/items?clean=true&format=json`; // Replace YOUR_API_TOKEN with your actual Apify token
            
                    var getDatasetUrl = 'https://api.apify.com/v2/datasets/C64dMc7bdygaOzG5i/items?clean=true&format=json'

                    // Poll the Apify dataset for results (this may need to be delayed or repeated based on actor execution time)
                    request(getDatasetUrl, function(err, response, body) {
                        if (err) {
                            console.error('Error getting dataset:', err);
                            res.status(500).send('Error retrieving the data.');
                            return;
                        }
            
                        var results = JSON.parse(body);
                        console.log('Results from dataset', results);
                        // You can now render these results or process them as required
                        

                        let data = Object.assign({}, webData, { scrapedData: results });

                        res.render('ratings.ejs', data);
                    });
                });
            });
            














}



















