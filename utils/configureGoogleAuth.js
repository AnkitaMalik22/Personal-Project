const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const configureGoogleAuth = (model, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackURL) => {
  passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await model.findOne({ googleId: profile.id });

        if (!user) {
          user = await model.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));

}

  passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user);
});


module.exports = configureGoogleAuth;
