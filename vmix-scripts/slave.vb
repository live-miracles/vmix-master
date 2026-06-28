' Script name: Slave
'
' Syncs active input, preview, and playback position with a master vMix instance.
' Polls master on every LOOP_TIME interval. Active input changes trigger a Stinger1
' transition. Position is only corrected when drift exceeds POSITION_THRESHOLD and
' both master and slave are in a Running state.

' Update the master IP below:
Dim masterAPI As String = "http://192.168.x.x:8088/api"

Dim SCRIPT_NAME As String = "slave"
Dim SCRIPT_VERSION As String = "1.2.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/vmix-scripts/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Slave " & SCRIPT_VERSION)

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
                Console.WriteLine(timestamp & " Slave | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    ' Non-fatal — version check failure should never stop the script
End Try

' ===== Configurations =====
Dim LOOP_TIME As Integer = 300          ' Poll interval in ms
Dim TRANSITION_BUFFER As Integer = 3000 ' Wait after a transition or position jump before next sync
Dim POSITION_THRESHOLD As Integer = 60000  ' Min drift in ms before correcting position (1 min)

Dim localXml As New System.Xml.XmlDocument()
Dim localResponse As String = ""
Dim localActive As String = ""
Dim localPreview As String = ""
Dim localPosition As Long = 0
Dim localState As String = ""

Dim responseText As String = ""
Dim masterXml As New System.Xml.XmlDocument()
Dim masterActive As String = ""
Dim masterPreview As String = ""
Dim masterPosition As Long = 0
Dim masterState As String = ""

If masterAPI = "http://192.168.x.x:8088/api" Then
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " Slave | Please update the masterAPI " & masterAPI & ". Exiting...")
    Return
End If

Do While True
    Sleep(LOOP_TIME)

    Try
        ' --- LOCAL ---
        localResponse = API.XML()
        localXml.LoadXml(localResponse)
        localActive = localXml.SelectSingleNode("//active").InnerText
        localPreview = localXml.SelectSingleNode("//preview").InnerText

        Dim localInputNode = localXml.SelectSingleNode("//inputs/input[@number='" & localActive & "']")
        If Not localInputNode Is Nothing Then
            Dim localPosAttr = localInputNode.Attributes("position")
            Dim localStateAttr = localInputNode.Attributes("state")
            localPosition = If(localPosAttr IsNot Nothing, CLng(localPosAttr.Value), 0)
            localState = If(localStateAttr IsNot Nothing, localStateAttr.Value, "")
        Else
            localPosition = 0
            localState = ""
        End If

        ' --- MASTER ---
        ' Use HttpWebRequest so we can set an explicit timeout (WebClient has no timeout API).
        Dim request As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(masterAPI)
        request.Timeout = 5000
        Dim webResponse As System.Net.HttpWebResponse = request.GetResponse()
        Dim reader As New System.IO.StreamReader(webResponse.GetResponseStream())
        responseText = reader.ReadToEnd()
        reader.Close()
        webResponse.Close()

        masterXml.LoadXml(responseText)
        masterActive = masterXml.SelectSingleNode("//active").InnerText
        masterPreview = masterXml.SelectSingleNode("//preview").InnerText

        Dim masterInputNode = masterXml.SelectSingleNode("//inputs/input[@number='" & masterActive & "']")
        If Not masterInputNode Is Nothing Then
            Dim masterPosAttr = masterInputNode.Attributes("position")
            Dim masterStateAttr = masterInputNode.Attributes("state")
            masterPosition = If(masterPosAttr IsNot Nothing, CLng(masterPosAttr.Value), 0)
            masterState = If(masterStateAttr IsNot Nothing, masterStateAttr.Value, "")
        Else
            masterPosition = 0
            masterState = ""
        End If

        ' --- ACTIVE INPUT SYNC ---
        If masterActive <> localActive Then
            API.Function("Stinger1", Input:=masterActive)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Slave | New active: " & masterActive)
            Sleep(TRANSITION_BUFFER)
        End If

        ' --- PREVIEW SYNC ---
        If masterPreview <> localPreview Then
            API.Function("PreviewInput", Input:=masterPreview)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Slave | New preview: " & masterPreview)
        End If

        ' --- POSITION SYNC (ONLY IF BOTH PLAYING) ---
        Dim positionDiff = Math.Abs(masterPosition - localPosition)

        If masterActive = localActive And masterPosition <> 0 And localPosition <> 0 Then
            If positionDiff > POSITION_THRESHOLD And localState = "Running" And masterState = "Running" Then
                API.Function("SetPosition", Input:=masterActive, Value:=CStr(masterPosition))

                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " Slave | Position sync: " & masterPosition & " (diff: " & positionDiff & ")")

                Sleep(TRANSITION_BUFFER)
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Slave | Unexpected error: " & ex.Message)
    End Try
Loop
