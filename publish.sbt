import org.codeoverflow.chatoverflow.build.BuildUtils.publishToGPR

// Filters out artifacts with javadoc and sources classifier
// because the gui doesn't have those. We just have the pom and jar with the compiled gui.
packagedArtifacts := packagedArtifacts.value.filter(_._1.classifier.isEmpty)

publishTo := publishToGPR("chatoverflow-gui")
publishMavenStyle := true

