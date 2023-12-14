module.exports = function(app, webData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
          req.session.originalUrl = req.originalUrl;
          res.redirect('./login')
        } else { next (); }
    }

    // const redirectnonlogin = (req, res, next) => {
    //     if (!req.session.userId ) {
    //       req.session.originalUrl = req.originalUrl;
    //     } else { next (); }
    // }






    const ApifyClient = require('apify-client');

    const saltRounds = 10;
    const bcrypt = require('bcrypt');

    const request = require('request');

    var runId;






    // Handle our routes
    app.get('/',function(req,res){

        let loginMesage = req.query.message
        webData.loginMessage = loginMesage

        res.render('index.ejs', webData)
    });

    
    app.get('/about', function(req,res){

        let loginMesage = req.query.message
        webData.loginMessage = loginMesage

        req.session.originalUrl = req.originalUrl;

        res.render('about.ejs', webData);
    });


    app.get('/search', redirectLogin, function(req,res){
        res.render("search.ejs", webData);
    });


    // app.get('/search-result', function (req, res) {
    //     //searching in the database
    //     //res.send("You searched for: " + req.query.keyword);

    //     let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
    //     // execute sql query
    //     db.query(sqlquery, (err, result) => {
    //         if (err) {
    //             res.redirect('./'); 
    //         }
    //         let newData = Object.assign({}, webData, {availableBooks:result});
    //         console.log(newData)
    //         res.render("list.ejs", newData)
    //      });        
    // });


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

        var errorMessage = req.query.error;
        let loginData = Object.assign({}, webData, {error:errorMessage});

        res.render('login.ejs', loginData);
    });




    app.post('/loggedin', function (req,res) {

         // Search for hashed password in your database.
         let sqlquery = "SELECT id, hashedPassword FROM userdetails WHERE username = ?";
         let userName = [req.body.username];



          // execute sql query
          db.query(sqlquery, userName, (err, result) => {

            if (err) {
               return console.error(err.message);

            } else if(result.length > 0) {

                //username found in database
                let hashedPassword = result[0].hashedPassword;

                console.log("id is " + result[0].id);

                req.session.userId = result[0].id

                 
        // Compare the password supplied with the password in the database
        bcrypt.compare(req.body.password, hashedPassword, function(err, result) {


            if (err) {
            // error message
            return console.log(err.message);
            }
            else if (result == true) {

                // login successful

                const redirectTo = req.session.originalUrl || '/';
                delete req.session.originalUrl; 
                
                // res.redirect('/login?error=Hello '+ ' ' + req.body.username + ' you are now logged in' )
                res.redirect(redirectTo + '?message=Hello '+ ' ' + req.body.username);

            }
            else {
                // login unsuccessful
                res.redirect('/login?error=Your Password is incorrect, please try again')
         }
       })

            } else {

                //No user found in database

                res.redirect('/login?error=Username is incorrect or does not exist, please try again')

            }
  })
}); 

           //page to display form for deleting user

            app.get('/deleteuser', redirectLogin, function (req,res) {
                res.render('deleteuser.ejs', webData);                                                                     
            });                           


           //delete a user from the database

            app.post('/deleteduser', redirectLogin, function (req,res) {

                let message = req.query.message; // Get the message from query parameters

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
        

            app.get('/logout', (req,res) => {

                // const redirectTo = req.session.originalUrl || '/';
                // delete req.session.originalUrl; 

                req.session.destroy(err => {
                if (err) {
                  return res.redirect('./')
                }
                res.send('you are now logged out. <a href='+'./'+'>Home</a>');

                // console.log('logout successful')
                // res.redirect('/forum');

                })
            })


            
            


            app.get('/ratings', redirectLogin, function(req, res) {
            
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

                    // var runId = body.data.defaultDatasetId; // Get the ID of the actor run
                    console.log(runId)

                    function pollForDataset() {


                        // for simple API/Series
                    // var runId = 'wzrMggBLbQAZ7zCKg';

                    //for big API
                    // var runId = 'QaPn6ZdQ20oPxaQ6y';
                    var runId = 'e72DEbjHgaHGrfTBJ';

                    var getDatasetUrl = `https://api.apify.com/v2/datasets/${runId}/items?token=apify_api_ehQMpaOXevsi0gm1AFaLAnTlAKaf6734a8Li`; 
            
        

                    // Poll the Apify dataset for results (this may need to be delayed or repeated based on actor execution time)
                   
                    request(getDatasetUrl, function(err, response, body) {
                        if (err) {
                            console.error('Error getting dataset:', err);
                            res.status(500).send('Error retrieving the data.');
                            return setTimeout(pollForDataset, 10000);
                            // return;
                        }
            
                        var results = JSON.parse(body);

                        if(results && results.length > 0){

                        console.log('Results from dataset', results);
                        

                        let movieData = Object.assign({}, webData, {movies:results});

                        let loginMesage = req.query.message
                        movieData.loginMessage = loginMesage

                        res.render('ratings.ejs', movieData);
                        }

                    else{
                        console.log('Waiting for dataset...');
                        return setTimeout(pollForDataset, 10000);
                    }

            });
        }
        pollForDataset();


                });

            });
            




// // Display forum posts
// app.get('/forum', redirectLogin, function(req, res) {

//     // let sqlQuery = "SELECT forum_posts.*, userdetails.username FROM forum_posts JOIN userdetails ON forum_posts.user_id = userdetails.id ORDER BY forum_posts.created_at DESC;"
//     let sqlQuery = "SELECT forum_posts.*, userdetails.username, comments.comment_content, comments.comment_id, comments.comment_created_at FROM forum_posts JOIN userdetails ON forum_posts.user_id = userdetails.id LEFT JOIN comments ON forum_posts.id = comments.post_id ORDER BY forum_posts.created_at DESC;"

    
//     db.query(sqlQuery, (err, result) => {
//         if (err) {
//             console.error(err.message);
//             return res.redirect('./');
//         }
//         let newData = Object.assign({}, webData, { posts: result });
//         res.render('forum.ejs', newData);
//     });
// });




app.get('/forum', redirectLogin, function(req, res) {

    let sqlQuery = `
    SELECT 
        forum_posts.*, 
        userdetails.username AS post_username, 
        comments.content AS comment_content, 
        comments.id AS comment_id, 
        comments.created_at AS comment_created_at, 
        commenter_details.username AS comment_username
    FROM 
        forum_posts 
    JOIN 
        userdetails ON forum_posts.user_id = userdetails.id
    LEFT JOIN 
        comments ON forum_posts.id = comments.post_id
    LEFT JOIN 
        userdetails AS commenter_details ON comments.user_id = commenter_details.id
    ORDER BY 
        forum_posts.created_at DESC, 
        comments.created_at ASC;
`;
    
    db.query(sqlQuery, (err, result) => {
        if (err) {
            console.error(err.message);
            return res.redirect('./');
        }

        let postsMap = new Map();

        result.forEach(row => {
            if (!postsMap.has(row.id)) {
                postsMap.set(row.id, {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    created_at: row.created_at,
                    username: row.post_username,
                    comments: []
                });
            }

            console.log(postsMap)
            
            let post = postsMap.get(row.id);

            if (row.comment_id) {

                if(!post.comments.find(comment => comment.comment_id === row.comment_id))
                post.comments.push({
                    comment_content: row.comment_content,
                    comment_id: row.comment_id,
                    comment_created_at: row.comment_created_at,
                    comment_username: row.comment_username // Added this line
                });
            }
        });

        let newData = Object.assign({}, webData, { posts: Array.from(postsMap.values()) });

        let loginMesage = req.query.message
        newData.loginMessage = loginMesage

        res.render('forum.ejs', newData);
    });
});













// Render a page to submit a new forum post
app.get('/forum/new', redirectLogin, function(req, res) {
    res.render('newpost.ejs', webData);
});

// Handle new post submission
app.post('/forum', redirectLogin, function(req, res) {

    let newPost = {
        user_id: req.session.userId, // Assuming you store the user's ID in the session
        title: req.sanitize(req.body.title),
        content: req.sanitize(req.body.content)
    };

    console.log("User ID:", newPost.user_id); // Add this line for debugging

    let sqlQuery = "INSERT INTO forum_posts (user_id, title, content) VALUES (?, ?, ?)";
    db.query(sqlQuery, [newPost.user_id, newPost.title, newPost.content], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.redirect('/forum/new');
        }
        res.redirect('/forum');
    });
});




// Handle comment submission
app.post('/comment', function (req, res) {
    // Create a comment object
    let newComment = {
        post_id: req.body.postId, // ID of the post the comment is associated with
        user_id: req.session.userId, // Assuming you store the user's ID in the session
        content: req.sanitize(req.body.commentContent) // Sanitize the comment content if needed
    };

    console.log("User ID:", newComment.user_id); // Add this line for debugging

    // Define the SQL query to insert the comment into the database
    let sqlQuery = "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)";
    
    // Execute the SQL query with the comment data
    db.query(sqlQuery, [newComment.post_id, newComment.user_id, newComment.content], (err, result) => {
        if (err) {
            console.error("Error saving comment to the database:", err.message);
            // Handle the error (e.g., send an error response)
            res.status(500).json({ error: 'An error occurred while saving the comment.' });
        } else {
            // Comment saved successfully
            console.log('Comment saved successfully to the database.');
            // Redirect to the post or forum page after comment submission




            // res.redirect('/post/' + newComment.post_id); // Redirect to the post page with the updated comments
            res.redirect('/forum'); // Redirect to the post page with the updated comments




        }
    });
});

app.get('/reviews',function(req,res){

    let loginMesage = req.query.message
    webData.loginMessage = loginMesage

    res.render('reviews.ejs', webData);
});




}



















