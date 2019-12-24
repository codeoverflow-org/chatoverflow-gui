import org.codeoverflow.chatoverflow.build.GUIUtility

name := "chatoverflow-gui"

// Loads version from package.json
version := {
  val util = new GUIUtility(null)
  util.getPackageJson(baseDirectory.value).flatMap(json => util.getGUIVersion(json)).getOrElse("unknown")
}

Compile / compile := {
  new GUIUtility(streams.value.log).guiTask("gui", target.value, (Compile / classDirectory).value)
  (Compile / compile).value
}


// The angular gui is obviously not using scala so we should drop the scala suffix and scala lib.
autoScalaLibrary := false
crossPaths := false

cleanFiles += baseDirectory.value / "dist"
packageBin / includePom := false
