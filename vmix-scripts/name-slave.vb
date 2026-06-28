' Script name: NameSlave
'
' Follows a master vMix instance by input name rather than input number.
' When the master switches to an input named X, this script switches the local
' vMix to its own input with the same name. If no matching name exists locally,
' it falls back to DEFAULT_INPUT.
'
' Update the master IP below:
Dim masterAPI As String = "http://192.168.x.x:8088/api"

Dim SCRIPT_NAME As String = "name-slave"
Dim SCRIPT_VERSION As String = "1.1.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " NameSlave " & SCRIPT_VERSION)

' --- VERSION CHECK ---
Try
    Dim verRequest As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(VERSIONS_URL)
    verRequest.Timeout = 5000
    Dim verResponse As System.Net.HttpWebResponse = verRequest.GetResponse()
    Dim verReader As New System.IO.StreamReader(verResponse.GetResponseStream())
    Dim verJson As String = verReader.ReadToEnd()
    verReader.Close()
    verResponse.Close()

    Dim key As String = """" & SCRIPT_NAME & """:"
    Dim keyIndex As Integer = verJson.IndexOf(key)
    If keyIndex >= 0 Then
        Dim valueStart As Integer = verJson.IndexOf("""", keyIndex + key.Length) + 1
        Dim valueEnd As Integer = verJson.IndexOf("""", valueStart)
        If valueStart > 0 And valueEnd > valueStart Then
            Dim latestVersion As String = verJson.Substring(valueStart, valueEnd - valueStart)
            If latestVersion <> SCRIPT_VERSION Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " NameSlave | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " NameSlave | Could not check for updates: " & ex.Message)
End Try

' ===== Configurations =====
Dim LOOP_TIME As Integer = 300          ' Poll interval in ms
Dim TRANSITION As String = "Stinger1"   ' vMix transition function used when switching active input
Dim TRANSITION_BUFFER As Integer = 3000 ' Wait after a transition before next sync
Dim DEFAULT_INPUT As String = "1"       ' Fallback input number when no name match is found

Dim masterXml As New System.Xml.XmlDocument()
Dim localXml As New System.Xml.XmlDocument()

If masterAPI = "http://192.168.x.x:8088/api" Then
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " NameSlave | Please update the masterAPI " & masterAPI & ". Exiting...")
    Return
End If

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Use HttpWebRequest so we can set an explicit timeout (WebClient has no timeout API).
        Dim request As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(masterAPI)
        request.Timeout = 5000
        Dim webResponse As System.Net.HttpWebResponse = request.GetResponse()
        Dim reader As New System.IO.StreamReader(webResponse.GetResponseStream())
        masterXml.LoadXml(reader.ReadToEnd())
        reader.Close()
        webResponse.Close()

        ' Load local XML first so name lookups are against current state
        localXml.LoadXml(API.XML())

        Dim masterActive As String = masterXml.SelectSingleNode("//active").InnerText
        Dim masterActiveTitle As String = masterXml.SelectSingleNode("//input[@number='" & masterActive & "']").Attributes("title").Value
        Dim correctActiveNode = localXml.SelectSingleNode("//input[@title='" & masterActiveTitle & "']")
        Dim correctActive As String = DEFAULT_INPUT
        If correctActiveNode IsNot Nothing Then
            correctActive = correctActiveNode.Attributes("number").Value
        End If

        Dim masterPreview As String = masterXml.SelectSingleNode("//preview").InnerText
        Dim masterPreviewTitle As String = masterXml.SelectSingleNode("//input[@number='" & masterPreview & "']").Attributes("title").Value
        Dim correctPreviewNode = localXml.SelectSingleNode("//input[@title='" & masterPreviewTitle & "']")
        Dim correctPreview As String = DEFAULT_INPUT
        If correctPreviewNode IsNot Nothing Then
            correctPreview = correctPreviewNode.Attributes("number").Value
        End If

        Dim localActive As String = localXml.SelectSingleNode("//active").InnerText
        Dim localPreview As String = localXml.SelectSingleNode("//preview").InnerText

        If correctActive <> localActive Then
            API.Function(TRANSITION, correctActive)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " NameSlave | New active: " & correctActive & " (" & masterActiveTitle & ")")
            Sleep(TRANSITION_BUFFER)
        End If

        If correctPreview <> localPreview Then
            API.Function("PreviewInput", correctPreview)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " NameSlave | New preview: " & correctPreview & " (" & masterPreviewTitle & ")")
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " NameSlave | Unexpected error: " & ex.Message)
    End Try
Loop
