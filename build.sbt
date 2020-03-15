import org.codeoverflow.chatoverflow.build.{GUIUtility, BuildUtils}

name := "chatoverflow-gui"

// Loads version from package.json
version := {
  val util = new GUIUtility(null)
  val rawVersion = util.getPackageJson(baseDirectory.value).flatMap(json => util.getGUIVersion(json)).getOrElse("unknown")

  BuildUtils.dynamicSnapshotVersion(rawVersion)
}

def buildGui(prod: Boolean) = Def.task {
  new GUIUtility(streams.value.log).guiTask("gui", target.value, (Compile / classDirectory).value, prod)
}

Compile / compile := {
  buildGui(false).value
  (Compile / compile).value
}

lazy val deploy = TaskKey[Unit]("deploy", "Compiles a production version of the gui.")

// includes clean to get rid of any development version that may still be lying around and may get recognized by the cache
deploy := (Compile / packageBin).dependsOn(buildGui(true).dependsOn(clean)).value

// The angular gui is obviously not using scala so we should drop the scala suffix and scala lib.
autoScalaLibrary := false
crossPaths := false

cleanFiles += baseDirectory.value / "dist"
packageBin / includePom := false
